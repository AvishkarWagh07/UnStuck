import { FEEDBACK_RESULTS, SYSTEM_OUTCOME_FIXED, SYSTEM_OUTCOME_OTHER } from '../config/constants.js';
import * as engine from '../services/dynamicEngine.js';
import * as geminiService from '../services/geminiService.js';
import * as sessionService from '../services/sessionService.js';
import * as dynamicService from '../services/dynamicSessionService.js';
import { BUSY_MESSAGE, QUOTA_MESSAGE, NO_KEY_MESSAGE } from '../services/dynamicSessionService.js';

// all routes here are behind requireAuth so req.user.id is always set

// build the full state the client renders from what is saved
async function respondWithState(res, session, extra) {
  const steps = await sessionService.loadSteps(session._id);
  const attempts = await sessionService.loadAttempts(session._id);
  const state = sessionService.buildState(session, steps, attempts);
  res.json(Object.assign({ state: state }, extra || {}));
}

// POST /api/sessions  { problem }
export async function startSession(req, res, next) {
  try {
    console.log('[api] start session');
    const check = engine.validateProblem(req.body && req.body.problem);
    if (!check.ok) {
      res.status(400).json({ error: { message: check.message, code: 'VALIDATION' } });
      return;
    }

    const session = await sessionService.createSession({
      userId: req.user.id,
      problemStatement: check.value
    });

    // first step is made before anything shows so the user does not land on an
    // empty screen
    const outcome = await dynamicService.advanceSession({ session: session });

    // the writer was busy, no step came back, so drop the session and tell them
    // to just try again
    if (outcome.busy) {
      await sessionService.deleteSession(session._id);
      const message = outcome.message || BUSY_MESSAGE;
      res.status(503).json({ error: { message: message, code: 'BUSY' } });
      return;
    }

    await respondWithState(res, session, { escalated: outcome.escalated });
  } catch (err) {
    next(err);
  }
}

// POST /api/sessions/explain  { text } or { image: { mimeType, data } }
//
// the user already has the instructions, they are read once into a plan. after
// that the steps come from the plan so the ai allowance is spent once, not per
// step
export async function startExplainSession(req, res, next) {
  try {
    const body = req.body || {};

    // a photo wins if both are sent, text is just a leftover
    let text = '';
    let image = null;
    let sourceKind = '';

    if (body.image) {
      const check = engine.validateImage(body.image);
      if (!check.ok) {
        res.status(400).json({ error: { message: check.message, code: 'VALIDATION' } });
        return;
      }
      image = check.image;
      sourceKind = 'photo';
    } else {
      const check = engine.validateInstructions(body.text);
      if (!check.ok) {
        res.status(400).json({ error: { message: check.message, code: 'VALIDATION' } });
        return;
      }
      text = check.value;
      sourceKind = 'text';
    }

    const read = await geminiService.readInstructions({
      text: text,
      image: image,
      userId: req.user.id
    });

    // nothing saved yet, so a failure here costs the user nothing
    if (!read.ok) {
      if (read.reason === 'busy') {
        res.status(503).json({ error: { message: BUSY_MESSAGE, code: 'BUSY' } });
        return;
      }
      if (read.reason === 'quota') {
        res.status(503).json({ error: { message: QUOTA_MESSAGE, code: 'QUOTA' } });
        return;
      }
      if (read.reason === 'no-key') {
        res.status(503).json({ error: { message: NO_KEY_MESSAGE, code: 'NO_KEY' } });
        return;
      }
      res.status(422).json({
        error: {
          message:
            'These could not be read as instructions. If it is a photo, try again in better light and closer to the page.',
          code: 'UNREADABLE'
        }
      });
      return;
    }

    const plan = engine.validateInstructionPlan(read.data);
    if (!plan) {
      res.status(422).json({
        error: {
          message: 'Something was read, but not steps that could be followed safely.',
          code: 'UNREADABLE'
        }
      });
      return;
    }

    // the model can say the instructions are not safe to follow, take that at
    // face value instead of patching together a plan
    if (plan.refused) {
      res.status(422).json({ error: { message: plan.message, code: 'REFUSED' } });
      return;
    }

    const session = await sessionService.createExplainSession({
      userId: req.user.id,
      subject: plan.subject,
      sourceKind: sourceKind,
      sourceText: text || undefined,
      plan: plan.steps,
      warnings: plan.warnings
    });

    // hand over the first step straight away so no empty screen
    const served = await dynamicService.serveNextPlanStep(session);

    await respondWithState(res, session, {
      escalated: served.escalated,
      warnings: plan.warnings
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/sessions/:id
export async function getSession(req, res, next) {
  try {
    const session = await sessionService.loadSession(req.params.id, req.user.id);
    await respondWithState(res, session);
  } catch (err) {
    next(err);
  }
}

// POST /api/sessions/:id/attempts  { outcomeKey, notes, durationSeconds }
export async function postAttempt(req, res, next) {
  try {
    const outcomeKey = req.body && req.body.outcomeKey;
    if (!outcomeKey) {
      res.status(400).json({ error: { message: 'outcomeKey is required', code: 'VALIDATION' } });
      return;
    }

    const session = await sessionService.loadSession(req.params.id, req.user.id);
    if (sessionService.isTerminal(session.status)) {
      res.status(409).json({ error: { message: 'This session is already finished', code: 'SESSION_FINISHED' } });
      return;
    }

    // acting again wakes a paused session up
    if (session.status === 'paused') {
      await sessionService.resumeSession(session);
    }

    const steps = await sessionService.loadSteps(session._id);
    const current = sessionService.findStepByKey(steps, session.currentStepKey);
    if (!current) {
      res.status(409).json({ error: { message: 'There is no step to answer', code: 'NO_CURRENT_STEP' } });
      return;
    }

    // answer has to be one we actually offered, so a stale tab cannot push an
    // outcome from an older step
    const mode = session.mode || 'dynamic';
    const offered = engine.appendSystemOutcomes(current.outcomes, mode);
    let found = false;
    for (let i = 0; i < offered.length; i++) {
      if (offered[i].key === outcomeKey) found = true;
    }
    if (!found) {
      res.status(400).json({ error: { message: 'That answer does not belong to this step', code: 'OUTCOME_NOT_FOUND' } });
      return;
    }

    const attempt = await sessionService.recordAttempt({
      session: session,
      step: current,
      outcomeKey: outcomeKey,
      notes: req.body.notes,
      durationSeconds: req.body.durationSeconds
    });

    // "that fixed it" is the user's claim, not proof, so we move to a confirm
    // state instead of calling it solved
    if (outcomeKey === SYSTEM_OUTCOME_FIXED) {
      session.pendingConfirmation = true;
      session.lastNotice = undefined;
      session.lastActivityAt = new Date();
      await session.save();
      await respondWithState(res, session);
      return;
    }

    // explain sessions follow a plan we already have, so the answers mean
    // something else: done hands over the next step, only a failed step costs
    // an ai call
    if (mode === 'explain') {
      const outcome = await dynamicService.continueExplainSession({
        session: session,
        outcomeKey: outcomeKey
      });

      if (outcome.busy) {
        await sessionService.removeAttempt(attempt._id);
      }

      await respondWithState(res, session, {
        escalated: outcome.escalated,
        busy: outcome.busy,
        planFinished: outcome.planFinished
      });
      return;
    }

    let extra = '';
    if (outcomeKey === SYSTEM_OUTCOME_OTHER) {
      extra =
        'The user said none of the options on screen matched what they saw. Ask one short clarifying question, or escalate if you cannot narrow it down safely.';
    }

    const outcome = await dynamicService.advanceSession({
      session: session,
      extraInstruction: extra
    });

    // the answer was only saved for the engine to read, no new step came back
    // so undo it and keep the same step on screen
    if (outcome.busy) {
      await sessionService.removeAttempt(attempt._id);
    }

    await respondWithState(res, session, { escalated: outcome.escalated, busy: outcome.busy });
  } catch (err) {
    next(err);
  }
}

// POST /api/sessions/:id/back
export async function postBack(req, res, next) {
  try {
    const session = await sessionService.loadSession(req.params.id, req.user.id);
    const result = await sessionService.goBackStep(session);
    await respondWithState(res, result.session, { moved: result.moved });
  } catch (err) {
    next(err);
  }
}

// POST /api/sessions/:id/pause
export async function postPause(req, res, next) {
  try {
    const session = await sessionService.loadSession(req.params.id, req.user.id);
    const updated = await sessionService.pauseSession(session);
    await respondWithState(res, updated);
  } catch (err) {
    next(err);
  }
}

// POST /api/sessions/:id/resume
export async function postResume(req, res, next) {
  try {
    const session = await sessionService.loadSession(req.params.id, req.user.id);
    const updated = await sessionService.resumeSession(session);
    await respondWithState(res, updated);
  } catch (err) {
    next(err);
  }
}

// POST /api/sessions/:id/resolve  { resolved: boolean }
export async function postResolve(req, res, next) {
  try {
    const resolved = req.body && req.body.resolved === true;
    const session = await sessionService.loadSession(req.params.id, req.user.id);
    const updated = await sessionService.confirmResolution(session, resolved);
    await respondWithState(res, updated);
  } catch (err) {
    next(err);
  }
}

// POST /api/sessions/:id/abandon
export async function postAbandon(req, res, next) {
  try {
    const session = await sessionService.loadSession(req.params.id, req.user.id);
    const updated = await sessionService.abandonSession(session);
    await respondWithState(res, updated);
  } catch (err) {
    next(err);
  }
}

// POST /api/sessions/:id/feedback  { rating, result, confusingStepKey, comment }
export async function postFeedback(req, res, next) {
  try {
    const body = req.body || {};
    if (FEEDBACK_RESULTS.indexOf(body.result) === -1) {
      res.status(400).json({
        error: { message: 'result must be one of ' + FEEDBACK_RESULTS.join(', '), code: 'VALIDATION' }
      });
      return;
    }

    const session = await sessionService.loadSession(req.params.id, req.user.id);
    const feedback = await sessionService.addFeedback({
      session: session,
      userId: req.user.id,
      rating: body.rating,
      result: body.result,
      confusingStepKey: body.confusingStepKey,
      comment: body.comment
    });

    res.status(201).json({
      ok: true,
      feedback: {
        id: feedback._id,
        rating: feedback.rating,
        result: feedback.result,
        createdAt: feedback.createdAt
      }
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/sessions
export async function listSessions(req, res, next) {
  try {
    const rows = await sessionService.listSessionsForUser(req.user.id, 20);

    const sessions = [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      sessions.push({
        id: row._id,
        mode: row.mode,
        problemStatement: row.problemStatement,
        status: row.status,
        stepNumber: row.stepCount,
        startedAt: row.startedAt,
        lastActivityAt: row.lastActivityAt,
        completedAt: row.completedAt,
        resolutionConfirmed: row.resolutionConfirmed
      });
    }

    res.json({ count: sessions.length, sessions: sessions });
  } catch (err) {
    next(err);
  }
}
