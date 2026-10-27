import * as engine from './dynamicEngine.js';
import * as geminiService from './geminiService.js';
import * as sessionService from './sessionService.js';

// runs the model's suggestion past every check, retries once, then gives up

export const NO_KEY_MESSAGE =
  'This app needs an AI key on the server, and none is configured right now. ' +
  'Nothing has been invented to fill the gap. Ask whoever runs this app to add GEMINI_API_KEY, then try again.';

const STEP_LIMIT_MESSAGE =
  'We have been through as many steps as this app allows without settling the problem, so it is ' +
  'stopping rather than guessing. Take the list of things you already tried to someone who can ' +
  'look at it with you.';

// same idea but for a plan, the list just runs out
const PLAN_LIMIT_MESSAGE =
  'That is as far as these instructions can take you in one go, so the app is stopping there. ' +
  'Everything you already worked through is saved, and you can pick it up again from My sessions.';

// temporary busy, not an escalation, just try again
export const BUSY_MESSAGE =
  'The step writer is busy at the moment and did not answer. Nothing about your session has been ' +
  'changed, so try again in a few seconds.';

// daily quota gone, "try again in a few seconds" would be a lie here
export const QUOTA_MESSAGE =
  'The AI key behind this app has used up its free allowance for today, so no new step can be ' +
  'written right now. Your session and everything you already tried are safe. Try again after the ' +
  'daily allowance resets, or ask whoever runs this app for a different key.';

function repeatMessage(reason) {
  return (
    'The assistant could not produce a safe step that had not already been tried (' + reason + '). ' +
    'Rather than ask you to repeat something that did not work, we are stopping here.'
  );
}

// ask for a step and put it through every check, returns an object not a throw
export async function advanceSession({ session, extraInstruction }) {
  if (!engine.hasRoomForAnotherStep(session)) {
    await sessionService.markEscalated(session, STEP_LIMIT_MESSAGE);
    return { escalated: true, step: null };
  }

  const steps = await sessionService.loadSteps(session._id);
  const attempts = await sessionService.loadAttempts(session._id);

  // what was already shown, stops the model sending the user in a circle
  const previousSignatures = [];
  for (let i = 0; i < steps.length; i++) {
    previousSignatures.push(steps[i].actionSignature);
  }

  const historySteps = geminiService.attachAnswers(steps, attempts);

  let note = extraInstruction || '';
  let lastReason = '';

  // two rounds is plenty, it usually gets it right first time
  for (let round = 1; round <= engine.MAX_GENERATION_ATTEMPTS; round++) {
    const result = await geminiService.generateTroubleshootingStep({
      problem: session.problemStatement,
      historySteps: historySteps,
      extraInstruction: note,
      userId: session.userId,
      sessionId: session._id,
      stepNumber: session.stepCount + 1
    });

    if (!result.ok) {
      if (result.reason === 'no-key') {
        await sessionService.markEscalated(session, NO_KEY_MESSAGE);
        return { escalated: true, step: null };
      }

      // busy is temporary, leave the session alone and ask them to retry
      if (result.reason === 'busy') {
        await sessionService.markBusy(session, BUSY_MESSAGE);
        return { escalated: false, step: null, busy: true, message: BUSY_MESSAGE };
      }

      // quota gone, no point saying try again, nothing changes till tomorrow
      if (result.reason === 'quota') {
        await sessionService.markBusy(session, QUOTA_MESSAGE);
        return { escalated: false, step: null, busy: true, message: QUOTA_MESSAGE };
      }

      lastReason = 'the reply could not be read';
      note = 'Your last reply could not be read. Reply with JSON only, exactly in the shape you were given.';
      continue;
    }

    // model says it cannot help, that is a good outcome, take it
    if (engine.readStatus(result.data) === 'escalate') {
      await sessionService.markEscalated(session, engine.readEscalationMessage(result.data));
      return { escalated: true, step: null };
    }

    const generated = engine.validateGeneratedStep(result.data);
    if (!generated) {
      console.log('[ai] shape rejected, retrying');
      lastReason = 'the reply did not fit the expected shape';
      note = 'Your last reply was not usable. Return JSON only, with status "continue" and exactly the shape you were given.';
      continue;
    }

    const risk = engine.checkRisk(generated, session.mode);
    if (!risk.ok) {
      lastReason = 'the suggestion ' + risk.reason;
      note = 'Your last suggestion was rejected because it ' + risk.reason +
        '. Suggest a different action that is low risk, reversible, and doable from normal settings screens.';
      continue;
    }

    const signature = engine.actionSignature(generated.title + ' ' + generated.instruction);
    const repeat = engine.findRepeatedStep(signature, previousSignatures);
    if (repeat) {
      console.log('[ai] repeat found, score', repeat.score);
      lastReason = 'it repeated an action that was already tried';
      note = 'Your last suggestion repeated something the user has already tried. Suggest a genuinely different diagnostic action.';
      continue;
    }

    const step = await sessionService.appendStep(session, generated, {
      model: result.model,
      wasRegenerated: round > 1,
      notice: round > 1
        ? { kind: 'recovery', message: 'The first suggestion was rejected because ' + lastReason + ', so a different step was written instead.' }
        : null
    });

    return { escalated: false, step: step };
  }

  await sessionService.markEscalated(session, repeatMessage(lastReason));
  return { escalated: true, step: null };
}

// plan is already in memory so no AI call here, saves the free quota
export async function serveNextPlanStep(session) {
  if (!engine.hasRoomForAnotherStep(session)) {
    await sessionService.markEscalated(session, PLAN_LIMIT_MESSAGE);
    return { escalated: true, step: null, planFinished: false };
  }

  const plan = session.plan || [];
  const index = session.planIndex || 0;
  const next = plan[index];

  // plan empty, caller decides if that means finished or broken
  if (!next) {
    return { escalated: false, step: null, planFinished: true };
  }

  // bump the index first so a double click cannot serve the same step twice
  session.planIndex = index + 1;

  const step = await sessionService.appendStep(
    session,
    {
      title: next.title,
      instruction: next.instruction,
      why: next.why,
      expectedObservation: next.expectedObservation,
      estimatedSeconds: next.estimatedSeconds,
      riskLevel: next.riskLevel,
      outcomes: next.outcomes
    },
    { model: 'instruction-reader' }
  );

  return { escalated: false, step: step, planFinished: session.planIndex >= plan.length };
}

// after the user answers a plan step, done is free, anything else needs the model
export async function continueExplainSession({ session, outcomeKey }) {
  if (outcomeKey === 'done') {
    if ((session.planIndex || 0) >= (session.plan || []).length) {
      await sessionService.markPlanFinished(session);
      return { escalated: false, step: null, planFinished: true };
    }
    return serveNextPlanStep(session);
  }

  // stuck or nothing matched, the plan ran out so ask the model for one step
  const note =
    outcomeKey === 'stuck'
      ? 'The user is following instructions they brought in, and could not do the step that was just shown. ' +
        'Write one simpler step to get them past that exact spot. Do not repeat the plan step and do not restart from the beginning.'
      : 'The user is following instructions they brought in, and what they saw did not match any option. ' +
        'Write one short step that makes clear what to look for next.';

  return advanceSession({ session: session, extraInstruction: note });
}
