import * as geminiService from '../services/geminiService.js';
import * as sessionService from '../services/sessionService.js';

// ai endpoints. these sit behind requireAuth so they are never public

// POST /api/assist/explain  { sessionId, level }
export async function explain(req, res, next) {
  try {
    const sessionId = req.body && req.body.sessionId;
    if (!sessionId) {
      res.status(400).json({ error: { message: 'sessionId is required', code: 'VALIDATION' } });
      return;
    }

    const session = await sessionService.loadSession(sessionId, req.user.id);
    const steps = await sessionService.loadSteps(session._id);
    const current = sessionService.findStepByKey(steps, session.currentStepKey);
    if (!current) {
      res.status(404).json({ error: { message: 'This session has no step to explain', code: 'NO_CURRENT_STEP' } });
      return;
    }

    // map to the field names the client renders
    const step = {
      stepKey: current.stepKey,
      title: current.title,
      instruction: current.instruction,
      whyItMatters: current.why,
      expectedObservation: current.expectedObservation,
      riskLevel: current.riskLevel
    };

    const result = await geminiService.explainStep({
      step: step,
      level: req.body.level,
      userId: req.user.id,
      sessionId: session._id
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

// POST /api/assist/summarize  { sessionId }
export async function summarize(req, res, next) {
  try {
    const sessionId = req.body && req.body.sessionId;
    if (!sessionId) {
      res.status(400).json({ error: { message: 'sessionId is required', code: 'VALIDATION' } });
      return;
    }

    const session = await sessionService.loadSession(sessionId, req.user.id);
    const steps = await sessionService.loadSteps(session._id);
    const attempts = await sessionService.loadAttempts(session._id);

    const result = await geminiService.summarizeSession({
      session: session,
      steps: steps,
      attempts: attempts,
      userId: req.user.id
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}
