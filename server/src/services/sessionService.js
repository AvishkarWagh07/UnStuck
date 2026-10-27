import GuideSession from '../models/GuideSession.js';
import TroubleshootStep from '../models/TroubleshootStep.js';
import StepAttempt from '../models/StepAttempt.js';
import GuideFeedback from '../models/GuideFeedback.js';
import * as engine from './dynamicEngine.js';
import {
  SYSTEM_OUTCOME_FIXED,
  SYSTEM_OUTCOME_OTHER,
  FIXED_LABELS,
  OTHER_LABELS,
  MAX_SESSION_STEPS
} from '../config/constants.js';

// reads and writes the session records, no model calls in here

const TERMINAL_STATUSES = ['resolved', 'unresolved', 'escalated', 'abandoned'];

export function isTerminal(status) {
  return TERMINAL_STATUSES.indexOf(status) !== -1;
}

// one account can never read another's history
export function canAccess(session, userId) {
  if (!userId) return false;
  if (!session.userId) return false;
  return String(session.userId) === String(userId);
}

export async function loadSession(id, userId) {
  const session = await GuideSession.findById(id);
  if (!session) {
    const err = new Error('Session not found');
    err.status = 404;
    throw err;
  }
  if (!canAccess(session, userId)) {
    const err = new Error('You do not have access to this session');
    err.status = 403;
    throw err;
  }
  return session;
}

export async function createSession({ userId, problemStatement }) {
  const session = await GuideSession.create({
    userId: userId,
    mode: 'dynamic',
    problemStatement: problemStatement,
    status: 'in_progress',
    currentStepKey: null,
    visitedStepKeys: [],
    stepCount: 0,
    maxSteps: MAX_SESSION_STEPS,
    startedAt: new Date(),
    lastActivityAt: new Date()
  });
  return session;
}

// explain session, plan is saved once and handed over step by step
// sourceText only kept for typed input, we drop photos
export async function createExplainSession({ userId, subject, sourceKind, sourceText, plan, warnings }) {
  const session = await GuideSession.create({
    userId: userId,
    mode: 'explain',
    problemStatement: subject,
    sourceKind: sourceKind,
    sourceText: sourceText,
    plan: plan,
    planIndex: 0,
    planWarnings: warnings && warnings.length > 0 ? warnings : undefined,
    status: 'in_progress',
    currentStepKey: null,
    visitedStepKeys: [],
    stepCount: 0,
    maxSteps: MAX_SESSION_STEPS,
    startedAt: new Date(),
    lastActivityAt: new Date()
  });
  return session;
}

export async function loadSteps(sessionId) {
  return TroubleshootStep.find({ sessionId: sessionId }).sort({ stepNumber: 1 });
}

export async function loadAttempts(sessionId) {
  return StepAttempt.find({ sessionId: sessionId }).sort({ attemptedAt: 1 });
}

export function findStepByKey(steps, stepKey) {
  for (let i = 0; i < steps.length; i++) {
    if (steps[i].stepKey === stepKey) return steps[i];
  }
  return null;
}

export async function appendStep(session, generated, meta) {
  const stepNumber = session.stepCount + 1;
  const stepKey = 'step-' + stepNumber;

  const step = await TroubleshootStep.create({
    sessionId: session._id,
    stepKey: stepKey,
    stepNumber: stepNumber,
    title: generated.title,
    instruction: generated.instruction,
    why: generated.why,
    expectedObservation: generated.expectedObservation,
    estimatedSeconds: generated.estimatedSeconds,
    riskLevel: generated.riskLevel,
    outcomes: generated.outcomes,
    actionSignature: engine.actionSignature(generated.title + ' ' + generated.instruction),
    problemSummary: generated.problemSummary,
    model: meta && meta.model ? meta.model : '',
    wasRegenerated: Boolean(meta && meta.wasRegenerated)
  });

  session.currentStepKey = stepKey;
  if (session.visitedStepKeys.indexOf(stepKey) === -1) {
    session.visitedStepKeys.push(stepKey);
  }
  session.stepCount = stepNumber;
  session.status = 'in_progress';
  session.pendingConfirmation = false;
  session.lastActivityAt = new Date();
  session.lastNotice = meta && meta.notice ? meta.notice : undefined;
  await session.save();

  return step;
}

// one row per answer, we keep them all
export async function recordAttempt({ session, step, outcomeKey, notes, durationSeconds }) {
  const previous = await StepAttempt.find({ sessionId: session._id, stepKey: step.stepKey });
  const attemptNumber = previous.length + 1;

  const attempt = await StepAttempt.create({
    sessionId: session._id,
    stepKey: step.stepKey,
    attemptNumber: attemptNumber,
    selectedOutcome: outcomeKey,
    notes: notes || undefined,
    durationSeconds: typeof durationSeconds === 'number' ? durationSeconds : undefined,
    attemptedAt: new Date(),
    source: 'user'
  });

  session.lastActivityAt = new Date();
  await session.save();
  return attempt;
}

export async function markEscalated(session, message) {
  session.status = 'escalated';
  session.completedAt = new Date();
  session.lastNotice = { kind: 'escalate', message: message };
  session.summary = buildSessionSummary(session, await loadSteps(session._id), await loadAttempts(session._id));
  await session.save();
  return session;
}

// not ended, just a notice, the user can retry and carry on
export async function markBusy(session, message) {
  session.lastNotice = { kind: 'busy', message: message };
  session.lastActivityAt = new Date();
  await session.save();
  return session;
}

// plan ran out but we do not call it resolved, ask the user to confirm
export async function markPlanFinished(session) {
  session.pendingConfirmation = true;
  session.lastNotice = {
    kind: 'finished',
    message: 'That was the last step in these instructions. Tell us whether that got you all the way to the end.'
  };
  session.lastActivityAt = new Date();
  await session.save();
  return session;
}

// never got a first step, only clutter so remove it
export async function deleteSession(sessionId) {
  await GuideSession.deleteOne({ _id: sessionId });
}

// undo an answer when the engine failed, screen goes back to how it was
export async function removeAttempt(attemptId) {
  await StepAttempt.deleteOne({ _id: attemptId });
}

export async function goBackStep(session) {
  if (isTerminal(session.status)) {
    return { session: session, moved: false };
  }

  const visited = session.visitedStepKeys.slice();
  if (visited.length <= 1) {
    return { session: session, moved: false };
  }

  visited.pop();
  session.currentStepKey = visited[visited.length - 1];
  session.visitedStepKeys = visited;
  session.stepCount = visited.length;
  session.pendingConfirmation = false;
  session.lastNotice = undefined;
  session.lastActivityAt = new Date();
  await session.save();
  return { session: session, moved: true };
}

export async function pauseSession(session) {
  if (isTerminal(session.status)) {
    const err = new Error('A finished session cannot be paused');
    err.status = 409;
    throw err;
  }
  session.status = 'paused';
  session.lastActivityAt = new Date();
  await session.save();
  return session;
}

export async function resumeSession(session) {
  if (session.status === 'paused') {
    session.status = 'in_progress';
    session.lastActivityAt = new Date();
    await session.save();
  }
  return session;
}

// only the user can say it is solved, the engine cannot
export async function confirmResolution(session, resolved) {
  if (!session.pendingConfirmation && !isTerminal(session.status)) {
    const err = new Error('Confirm the result only after the session has finished');
    err.status = 409;
    throw err;
  }

  session.resolutionConfirmed = resolved === true;
  session.status = resolved === true ? 'resolved' : 'unresolved';
  session.pendingConfirmation = false;
  session.completedAt = session.completedAt || new Date();
  await session.save();
  return session;
}

export async function abandonSession(session) {
  session.status = 'abandoned';
  session.completedAt = new Date();
  await session.save();
  return session;
}

// just stored for the record, never changes anything
export async function addFeedback({ session, userId, rating, result, confusingStepKey, comment }) {
  const feedback = await GuideFeedback.create({
    userId: userId,
    sessionId: session._id,
    rating: typeof rating === 'number' ? rating : undefined,
    result: result,
    confusingStepKey: confusingStepKey || undefined,
    comment: comment || undefined
  });
  return feedback;
}

// todo maybe move the 20 to constants
export async function listSessionsForUser(userId, limit) {
  return GuideSession.find({ userId: userId }).sort({ lastActivityAt: -1 }).limit(limit || 20).lean();
}

// the state the client renders, no model call, refresh shows the same step
export function buildState(session, steps, attempts) {
  const step = findStepByKey(steps, session.currentStepKey);

  // wording of the two escapes depends on mode, read it once
  const mode = session.mode || 'dynamic';

  const path = [];
  for (let i = 0; i < steps.length; i++) {
    path.push({ stepKey: steps[i].stepKey, title: steps[i].title });
  }

  const answerByStep = {};
  for (let i = 0; i < attempts.length; i++) {
    answerByStep[attempts[i].stepKey] = attempts[i].selectedOutcome;
  }

  const attemptList = [];
  for (let i = 0; i < attempts.length; i++) {
    const row = attempts[i];
    const owner = findStepByKey(steps, row.stepKey);
    let label = row.selectedOutcome;
    if (owner) {
      for (let j = 0; j < owner.outcomes.length; j++) {
        if (owner.outcomes[j].key === row.selectedOutcome) label = owner.outcomes[j].label;
      }
    }
    if (row.selectedOutcome === SYSTEM_OUTCOME_FIXED) label = FIXED_LABELS[mode] || FIXED_LABELS.dynamic;
    if (row.selectedOutcome === SYSTEM_OUTCOME_OTHER) label = OTHER_LABELS[mode] || OTHER_LABELS.dynamic;

    attemptList.push({
      id: row._id,
      stepKey: row.stepKey,
      stepTitle: owner ? owner.title : row.stepKey,
      attemptNumber: row.attemptNumber,
      selectedOutcome: row.selectedOutcome,
      outcomeLabel: label,
      attemptedAt: row.attemptedAt
    });
  }

  let stepView = null;
  if (step) {
    // escapes added here not stored, so they are always there
    const outcomes = engine.appendSystemOutcomes(step.outcomes, mode);
    const answered = answerByStep[step.stepKey];
    const finalOutcomes = [];
    for (let i = 0; i < outcomes.length; i++) {
      finalOutcomes.push({
        outcomeKey: outcomes[i].key,
        label: outcomes[i].label,
        alreadyTried: outcomes[i].key === answered
      });
    }

    stepView = {
      stepKey: step.stepKey,
      stepNumber: step.stepNumber,
      title: step.title,
      instruction: step.instruction,
      whyItMatters: step.why,
      expectedObservation: step.expectedObservation,
      estimatedSeconds: step.estimatedSeconds,
      riskLevel: step.riskLevel,
      outcomes: finalOutcomes
    };
  }

  // explain mode hands over a list it has, so we can show how far along
  const planLength = session.plan ? session.plan.length : 0;
  const planIndex = session.planIndex || 0;

  return {
    id: session._id,
    mode: mode,
    status: session.status,
    problemStatement: session.problemStatement,
    sourceKind: session.sourceKind || null,
    planWarnings: session.planWarnings ? session.planWarnings.slice() : [],
    planLength: planLength,
    planServed: planIndex,
    planLeft: Math.max(0, planLength - planIndex),
    startedAt: session.startedAt,
    lastActivityAt: session.lastActivityAt,
    completedAt: session.completedAt,
    resolutionConfirmed: session.resolutionConfirmed,
    pendingConfirmation: session.pendingConfirmation,
    summary: session.summary,
    stepNumber: session.stepCount,
    maxSteps: session.maxSteps,
    stepsLeft: Math.max(0, session.maxSteps - session.stepCount),
    canGoBack: session.visitedStepKeys.length > 1,
    step: stepView,
    path: path,
    attempts: attemptList,
    attemptsCount: attempts.length,
    notice: session.lastNotice && session.lastNotice.message
      ? { kind: session.lastNotice.kind, message: session.lastNotice.message }
      : null
  };
}

// written from the records not the model, so it cannot overstate
export function buildSessionSummary(session, steps, attempts) {
  const lines = [];
  lines.push('Problem: ' + session.problemStatement);
  lines.push('Steps shown: ' + steps.length);
  lines.push('Answers recorded: ' + attempts.length);

  const trail = [];
  for (let i = 0; i < attempts.length; i++) {
    const attempt = attempts[i];
    const owner = findStepByKey(steps, attempt.stepKey);
    trail.push((owner ? owner.title : attempt.stepKey) + ' -> ' + attempt.selectedOutcome);
  }
  if (trail.length > 0) {
    lines.push('What was reported:');
    for (let i = 0; i < trail.length; i++) {
      lines.push(' - ' + trail[i]);
    }
  }
  return lines.join('\n');
}
