import GeminiInteraction from '../models/GeminiInteraction.js';
import * as sessionService from './sessionService.js';
import * as engine from './dynamicEngine.js';
import { MAX_INSTRUCTION_TEXT } from '../config/constants.js';

// explain/summarize can fall back to rules, the step writer cannot
// no key there is a real failure, output still goes past dynamicEngine

// set GEMINI_MODEL in .env. free tier is 20 a day per model so use a lite one
const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';

function apiKey() {
  return process.env.GEMINI_API_KEY || '';
}

export function isAiEnabled() {
  return apiKey().trim() !== '';
}

// strip private stuff before storing or sending it anywhere
export function scrubText(text, maxLength) {
  if (!text) return '';
  const limit = maxLength && maxLength > 0 ? maxLength : 500;
  let cleaned = String(text);
  cleaned = cleaned.replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '[email]');
  cleaned = cleaned.replace(/(password|passwd|pwd)\s*[:=]\s*\S+/gi, '$1=[hidden]');
  cleaned = cleaned.replace(/\b\d{12,19}\b/g, '[number]');
  cleaned = cleaned.replace(/[A-Za-z0-9_-]{24,}/g, '[token]');
  if (cleaned.length > limit) cleaned = cleaned.slice(0, limit) + '...';
  return cleaned.trim();
}

// one call, always returns a kind so the caller knows why it failed
async function requestOnce(systemPrompt, userPrompt, timeoutMs, image) {
  const key = apiKey();
  if (!key) return { kind: 'no-key' };

  const parts = [{ text: userPrompt }];
  if (image && image.data) {
    parts.push({ inlineData: { mimeType: image.mimeType, data: image.data } });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs || 12000);

  try {
    const response = await fetch(ENDPOINT + '/' + DEFAULT_MODEL + ':generateContent?key=' + key, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: parts }],
        // low temp so it stops making things up
        generationConfig: { temperature: 0.2, responseMimeType: 'application/json' }
      })
    });

    if (!response.ok) {
      // print the real reason, a bad key looks the same as a bad reply
      const body = await response.text();
      console.log('[gemini] request failed:', response.status, body.slice(0, 300));

      // 429 means two things here. short burst = retry. daily quota gone = do not
      // retry, we would just waste what is left
      if (response.status === 429) {
        const daily =
          body.indexOf('PerDay') !== -1 || body.toLowerCase().indexOf('per day limit') !== -1;
        return { kind: daily ? 'quota' : 'unavailable', status: response.status };
      }

      // 5xx is usually a passing spike
      if (response.status >= 500) {
        return { kind: 'unavailable', status: response.status };
      }
      return { kind: 'unreadable', status: response.status };
    }

    const payload = await response.json();
    // this path is ugly, gemini nests the reply deep
    const text =
      payload &&
      payload.candidates &&
      payload.candidates[0] &&
      payload.candidates[0].content &&
      payload.candidates[0].content.parts &&
      payload.candidates[0].content.parts[0] &&
      payload.candidates[0].content.parts[0].text;

    if (!text) return { kind: 'unreadable' };

    try {
      return { kind: 'ok', data: JSON.parse(text) };
    } catch (err) {
      console.log('[gemini] reply was not JSON:', text.slice(0, 200));
      return { kind: 'unreadable' };
    }
  } catch (err) {
    // timeout or dropped connection, worth retrying
    console.log('[gemini] request error:', err.name, err.message);
    return { kind: 'unavailable' };
  } finally {
    clearTimeout(timer);
  }
}

// a 429 or 503 is usually a spike so wait it out and try again
const RETRY_DELAYS_MS = [700, 1800];

function sleep(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

// only retry the failures a retry can fix, unreadable and quota come straight back
async function callGemini(systemPrompt, userPrompt, timeoutMs, tries, image) {
  if (!apiKey()) return { kind: 'no-key' };

  // 3 tries max, more than that just means a longer spinner
  const maxTries = Math.min(tries && tries > 0 ? tries : 1, 3);
  let last = { kind: 'unavailable' };

  for (let attempt = 1; attempt <= maxTries; attempt++) {
    if (attempt > 1) {
      const wait = RETRY_DELAYS_MS[attempt - 2] || RETRY_DELAYS_MS[RETRY_DELAYS_MS.length - 1];
      console.log(
        '[gemini] temporary failure, retrying in ' + wait + 'ms (attempt ' + attempt + ' of ' + maxTries + ')'
      );
      await sleep(wait);
    }

    last = await requestOnce(systemPrompt, userPrompt, timeoutMs, image);
    if (last.kind !== 'unavailable') return last;
  }

  return last;
}

function validateExplain(data) {
  if (!data || typeof data !== 'object') return null;
  if (typeof data.explanation !== 'string' || data.explanation.trim() === '') return null;
  return {
    explanation: data.explanation.slice(0, 600),
    keepWarning: data.keepWarning === true
  };
}

// logging must never break the request
async function logInteraction(entry) {
  try {
    await GeminiInteraction.create(entry);
  } catch (err) {
    console.log('[assist] could not save interaction log:', err.message);
  }
}

export async function explainStep({ step, level, userId, sessionId }) {
  if (!step) {
    const err = new Error('No step provided to explain');
    err.status = 400;
    throw err;
  }

  const system =
    'You rewrite an already verified troubleshooting step in simpler language. Keep the same action, do not add new steps, and never remove a warning. Reply with JSON only using keys explanation and keepWarning.';
  const userPrompt =
    'Step title: ' + step.title + '\nInstruction: ' + step.instruction + '\nWhy it matters: ' +
    (step.whyItMatters || '') + '\nExpected observation: ' + (step.expectedObservation || '') +
    '\nReading level: ' + (level || 'simple');

  const result = await callGemini(system, userPrompt, 8000, 2);
  let validated = result.kind === 'ok' ? validateExplain(result.data) : null;
  let usedFallback = false;

  if (!validated) {
    usedFallback = true;
    const parts = [];
    parts.push('In simple words: ' + step.instruction);
    if (step.whyItMatters) parts.push('This matters because ' + step.whyItMatters);
    if (step.expectedObservation) parts.push('Watch for this: ' + step.expectedObservation);
    validated = { explanation: parts.join(' '), keepWarning: step.riskLevel !== 'low' };
  }

  await logInteraction({
    userId: userId || undefined,
    sessionId: sessionId || undefined,
    stepKey: step.stepKey,
    interactionType: 'explain',
    inputSummary: scrubText(step.instruction),
    output: validated,
    model: usedFallback ? 'rule-based-fallback' : DEFAULT_MODEL,
    status: 'success',
    usedFallback: usedFallback
  });

  return { ...validated, usedFallback, model: usedFallback ? 'rule-based-fallback' : DEFAULT_MODEL };
}

export async function summarizeSession({ session, steps, attempts, userId }) {
  const deterministic = sessionService.buildSessionSummary(session, steps, attempts);

  const attemptLines = [];
  for (let i = 0; i < attempts.length; i++) {
    attemptLines.push(attempts[i].stepKey + ' -> ' + attempts[i].selectedOutcome);
  }

  const system =
    'You summarize a troubleshooting session for the user. Only describe what was recorded. Do not claim the problem is fixed. Reply with JSON only using keys summary and stillUnresolved (array of strings).';
  const userPrompt =
    'Problem: ' + session.problemStatement +
    '\nSession status: ' + session.status +
    '\nSteps shown: ' + steps.length +
    '\nOutcomes recorded: ' + attemptLines.join(', ');

  const result = await callGemini(system, userPrompt, 8000, 2);
  const data = result.kind === 'ok' ? result.data : null;
  let validated = null;
  if (data && typeof data.summary === 'string' && data.summary.trim() !== '') {
    validated = {
      summary: data.summary.slice(0, 800),
      stillUnresolved: Array.isArray(data.stillUnresolved)
        ? data.stillUnresolved.slice(0, 5).map((s) => String(s).slice(0, 160))
        : []
    };
  }

  const usedFallback = !validated;
  if (!validated) {
    validated = {
      summary: deterministic,
      stillUnresolved: ['Confirm whether the problem is actually solved before closing the session.']
    };
  }

  await logInteraction({
    userId: userId || undefined,
    sessionId: session._id,
    interactionType: 'summarize',
    inputSummary: scrubText(session.problemStatement),
    output: validated,
    model: usedFallback ? 'rule-based-fallback' : DEFAULT_MODEL,
    status: 'success',
    usedFallback: usedFallback
  });

  return { ...validated, usedFallback, model: usedFallback ? 'rule-based-fallback' : DEFAULT_MODEL };
}

// different job to the step writer, here the answer is already written
// risk is the model adding steps or dropping a warning, so stay faithful
const INSTRUCTIONS_SYSTEM_PROMPT = [
  'You are the reading part of an app that helps people follow instructions they already have.',
  '',
  'The instructions may be about anything at all: assembling furniture, cooking, filling in a form,',
  'a medicine leaflet, a school task, a sewing pattern, a gardening job, a device manual, a bank',
  'letter, a bus timetable. Never assume the subject is a computer. Never assume the user is technical.',
  '',
  'Your job is to read the instructions and rewrite them as short plain steps, in the same order.',
  '',
  'Hard rules:',
  '1. Only use what is written in the instructions you are given. Never invent, assume or add a step.',
  '2. Keep the original order. Do not merge steps together and do not reorder them.',
  '3. Write each step as one simple action, in everyday words, for someone doing this for the very',
  '   first time. No jargon. Keep brand names and exact quantities only if they appear in the original.',
  '4. Keep every warning and safety note that is in the original. Never soften or drop one.',
  '5. If a step cannot be done safely by an ordinary person, mark that step risk_level as "moderate"',
  '   instead of "low" so the app holds it back. Use "moderate" for anything involving mains',
  '   electricity, mixing chemicals, changing a medicine or its dose, medicines for children,',
  '   working at height, gas, sharp power tools, or anything you are not confident about.',
  '6. If the whole thing is unreadable, is not actually instructions, or cannot be followed safely at',
  '   all, set status to "refuse" and say why in refusal_message. Refusing is a good outcome.',
  '',
  'Reply with JSON only, in exactly this shape:',
  '{"status":"continue","subject":"one line saying what these instructions are for","steps":[{"title":"short title","instruction":"one simple action","why":"why this step is needed","expected_observation":"what the user should end up with","risk_level":"low","estimated_seconds":60}],"refusal_message":""}',
  '',
  'Step rules:',
  '- Between 1 and 10 steps. If the original has more, keep the first ones that make sense.',
  '- If the picture is too small, blurry or cropped to read properly, set status to "refuse" and say so.',
  '- Write nothing outside the JSON.'
].join('\n');

// text or photo in, plan out, same ok/reason shape as the step writer
export async function readInstructions({ text, image, userId }) {
  if (!isAiEnabled()) {
    return { ok: false, reason: 'no-key' };
  }

  const promptParts = [];
  if (text) {
    promptParts.push('Here are the instructions, given as text:');
    promptParts.push(scrubText(text, MAX_INSTRUCTION_TEXT));
  } else {
    promptParts.push('The instructions are in the picture. Read them and turn them into steps.');
  }
  promptParts.push('Return JSON only.');

  // photos take longer to read, 20s and 2 tries is enough
  const transport = await callGemini(
    INSTRUCTIONS_SYSTEM_PROMPT,
    promptParts.join('\n\n'),
    20000,
    2,
    image
  );

  const data = transport.kind === 'ok' ? transport.data : null;
  const readable = Boolean(data && typeof data === 'object');

  await logInteraction({
    userId: userId || undefined,
    interactionType: 'readInstructions',
    // never store the photo, just log that there was one
    inputSummary: text ? scrubText(text, 500) : '[photo]',
    output: readable ? data : { raw: transport.kind },
    model: readable ? DEFAULT_MODEL : 'none',
    status: readable ? 'success' : 'unavailable',
    usedFallback: false
  });

  if (transport.kind === 'unavailable') return { ok: false, reason: 'busy' };
  if (transport.kind === 'quota') return { ok: false, reason: 'quota' };
  if (!readable) return { ok: false, reason: 'unreadable' };

  return { ok: true, data: data };
}

// same list the guard uses, so prompt and check cannot drift apart
function forbiddenList() {
  const reasons = [];
  for (let i = 0; i < engine.BLOCKED_REASONS.length; i++) {
    reasons.push(engine.BLOCKED_REASONS[i].reason);
  }
  return reasons.join('; ');
}

const STEP_SYSTEM_PROMPT = [
  'You are the step generator inside a troubleshooting app used by people who are not technical.',
  'You produce exactly ONE instruction at a time. Never write a list. Never write a whole guide.',
  '',
  'Hard rules:',
  '1. Never repeat an action that already appears in the history you are given, even in different words.',
  '2. Only suggest actions that are low risk, reversible, and doable by someone who is not technical',
  '   using the normal settings and screens of their device.',
  '3. Never suggest anything that ' + forbiddenList() + '.',
  '4. One question or one action per step, phrased in plain everyday language. No jargon.',
  '5. If you are not confident you can help safely, set status to "escalate" and explain why in',
  '   escalation_message. Escalating is a good outcome, guessing is not.',
  '',
  'Reply with JSON only, in exactly this shape:',
  '{"status":"continue","problem_summary":"short restatement","step":{"title":"short title","instruction":"one action or one question","why":"why this helps","expected_observation":"what the user should see","risk_level":"low","estimated_seconds":45},"outcomes":[{"key":"short-key","label":"what the user would answer"}],"escalation_message":""}',
  '',
  'Outcome rules:',
  '- Give between 2 and 4 outcomes. Each is an answer the user could truthfully give.',
  '- Outcome keys are short lowercase phrases with dashes, for example "still-no-network".',
  '- The outcomes must describe what the user observed, never a guess about the cause.',
  '- Do not include an outcome about fixing the problem or giving up. The app adds its own.'
].join('\n');

// plain lines of history, this is the memory the model works from
function buildHistoryLines(steps) {
  const lines = [];
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    lines.push(step.stepNumber + '. Tried: ' + step.instruction);
    if (step.answeredWith) {
      lines.push('   The user reported: ' + step.answeredWith);
    } else {
      lines.push('   The user has not answered this yet.');
    }
  }
  return lines;
}

// match each step to the answer the user gave
export function attachAnswers(steps, attempts) {
  const answerByStep = {};
  for (let i = 0; i < attempts.length; i++) {
    answerByStep[attempts[i].stepKey] = attempts[i].selectedOutcome;
  }

  const out = [];
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const key = answerByStep[step.stepKey];
    let label = key;
    for (let j = 0; j < step.outcomes.length; j++) {
      if (step.outcomes[j].key === key) label = step.outcomes[j].label;
    }
    out.push({
      stepNumber: step.stepNumber,
      instruction: step.instruction,
      riskLevel: step.riskLevel,
      actionSignature: step.actionSignature,
      answeredWith: label || null
    });
  }
  return out;
}

// one step please. caller checks the shape, this only does transport
export async function generateTroubleshootingStep({
  problem,
  historySteps,
  extraInstruction,
  userId,
  sessionId,
  stepNumber
}) {
  if (!isAiEnabled()) {
    return { ok: false, reason: 'no-key' };
  }

  const safeProblem = scrubText(problem);
  const history = buildHistoryLines(historySteps);
  const alreadyTried = [];
  for (let i = 0; i < historySteps.length; i++) {
    alreadyTried.push(historySteps[i].instruction);
  }

  const userLines = [];
  userLines.push('The problem, in the user\'s own words:');
  userLines.push(safeProblem);
  userLines.push('');
  if (history.length === 0) {
    userLines.push('This is the first step. Nothing has been tried yet.');
  } else {
    userLines.push('What has already happened, in order:');
    for (let i = 0; i < history.length; i++) {
      userLines.push(history[i]);
    }
    userLines.push('');
    userLines.push('Do not suggest any of these again:');
    for (let i = 0; i < alreadyTried.length; i++) {
      userLines.push('- ' + alreadyTried[i]);
    }
  }
  if (extraInstruction) {
    userLines.push('');
    userLines.push('Additional note: ' + extraInstruction);
  }
  userLines.push('');
  userLines.push('Produce step number ' + stepNumber + '. Return JSON only.');

  // user is actually waiting on this one, 3 tries but a short timeout each
  const transport = await callGemini(STEP_SYSTEM_PROMPT, userLines.join('\n'), 9000, 3);
  const data = transport.kind === 'ok' ? transport.data : null;
  const readable = Boolean(data && typeof data === 'object');

  let status = 'success';
  if (transport.kind === 'unavailable' || transport.kind === 'quota') status = 'unavailable';
  else if (!readable) status = 'failed';

  await logInteraction({
    userId: userId || undefined,
    sessionId: sessionId || undefined,
    stepKey: 'step-' + stepNumber,
    interactionType: 'nextStep',
    inputSummary: safeProblem,
    output: readable ? data : { raw: transport.kind },
    model: readable ? DEFAULT_MODEL : 'none',
    status: status,
    usedFallback: false
  });

  // busy is not a bad answer, tell the caller so it does not end the session
  if (transport.kind === 'unavailable') {
    return { ok: false, reason: 'busy' };
  }

  // daily quota gone, own reason not "busy", retrying changes nothing
  if (transport.kind === 'quota') {
    return { ok: false, reason: 'quota' };
  }

  if (!readable) {
    return { ok: false, reason: 'unreadable' };
  }

  return { ok: true, data: data, model: DEFAULT_MODEL };
}

