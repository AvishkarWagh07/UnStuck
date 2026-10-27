// decides what the model is allowed to say, nothing here trusts it
// shape, risk, repeat, then room left in the session

import {
  MAX_GENERATION_ATTEMPTS,
  MAX_PLAN_STEPS,
  MAX_INSTRUCTION_TEXT,
  PLAN_OUTCOMES,
  FIXED_LABELS,
  OTHER_LABELS,
  SYSTEM_OUTCOME_FIXED,
  SYSTEM_OUTCOME_OTHER
} from '../config/constants.js';

// device and software moves, only checked on steps the app wrote itself
const FORBIDDEN_DEVICE = [
  { pattern: /\b(terminal|command prompt|cmd\.exe|powershell|bash|shell script)\b/i, reason: 'asks you to use a command line' },
  { pattern: /\b(sudo|run as administrator|administrator rights|root access|elevated prompt)\b/i, reason: 'needs administrator rights' },
  { pattern: /\b(delete|erase|wipe|format|factory reset|hard reset|restore from backup)\b/i, reason: 'could remove your data' },
  { pattern: /\b(uninstall|reinstall)\b/i, reason: 'removes and reinstalls software' },
  { pattern: /\b(disable|turn off|switch off|bypass)\b[^.]{0,40}\b(firewall|antivirus|security|protection|defender|two-?factor|2fa)\b/i, reason: 'weakens your security' },
  { pattern: /\b(registry|regedit|bios|uefi|firmware|flash the)\b/i, reason: 'changes low level system settings' },
  { pattern: /\b(open the (case|unit|device)|remove the battery|disassemble|unscrew|screwdriver|take it apart)\b/i, reason: 'involves opening the hardware' },
  { pattern: /\b(npm install|pip install|download and run|run the installer|execute the file|sideload|jailbreak|root your)\b/i, reason: 'asks you to install or run unknown software' },
  { pattern: /\b(api key|private key|seed phrase|credit card|card number|bank details)\b/i, reason: 'asks for something private' }
];

// dangerous whatever the subject is, so always checked
const FORBIDDEN_ANY = [
  { pattern: /\b(bleach|ammonia)\b[^.]{0,60}\b(mix|combine|together|with)\b|\bmix\b[^.]{0,40}\b(bleach|ammonia)\b/i, reason: 'mixes cleaning chemicals, which can give off fumes' },
  { pattern: /\b(mains|live wire|bare wire|exposed wire|fuse box|breaker box|consumer unit|electrical panel)\b/i, reason: 'involves mains electricity' },
  { pattern: /\b(double|triple|increase|lower|change|skip|stop|halve)\b[^.]{0,30}\b(dose|dosage|tablets?|pills?|medication|medicine|medicine's|insulin)\b/i, reason: 'changes how much medicine is taken' },
  { pattern: /\b(stop|skip)\b[^.]{0,40}\b(prescribed|prescription)\b/i, reason: 'changes prescribed medicine' },
  { pattern: /\b(smell of gas|gas leak|smells like gas)\b/i, reason: 'involves a gas leak, which needs a professional' },
  { pattern: /\b(light a (match|flame)|naked flame|candle)\b[^.]{0,50}\b(check|test|find|see)\b/i, reason: 'uses a naked flame to look for something' },
  { pattern: /\b(cut|remove|disconnect)\b[^.]{0,30}\b(earth wire|ground wire|bonding)\b/i, reason: 'touches protective wiring' },
  { pattern: /\b(ignore|bypass|override|work around)\b[^.]{0,40}\b(warning|alarm|safety|alert)\b/i, reason: 'asks you to ignore a safety warning' },
  { pattern: /\b(scaffold|stand on the roof|climb (onto|on) the roof|ladder on)\b/i, reason: 'involves working at height' },
  { pattern: /\b(taste|sniff|smell)\b[^.]{0,30}\b(to (check|see|tell)|if it (is|has))\b/i, reason: 'checks food safety by taste or smell' }
];

export const BLOCKED_REASONS = FORBIDDEN_DEVICE.concat(FORBIDDEN_ANY);
export const BLOCKED_ANY_REASONS = FORBIDDEN_ANY;

// too common to tell instructions apart, skip them when comparing
const STOP_WORDS = [
  'the', 'a', 'an', 'your', 'you', 'yours', 'is', 'are', 'was', 'were', 'be', 'been',
  'to', 'of', 'and', 'or', 'in', 'on', 'at', 'it', 'its', 'that', 'this', 'these', 'those',
  'with', 'for', 'if', 'then', 'than', 'as', 'by', 'from', 'into', 'about', 'after', 'before',
  'again', 'also', 'just', 'now', 'please', 'try', 'make', 'made', 'sure', 'should', 'would',
  'can', 'could', 'will', 'may', 'might', 'do', 'does', 'did', 'not', 'no', 'yes', 'open',
  'look', 'see', 'check', 'find', 'go', 'get', 'got', 'use', 'using', 'one', 'two', 'first',
  'next', 'step', 'screen', 'back', 'up', 'down', 'out', 'off', 'over'
];

function clean(value, max) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/\s+/g, ' ').trim().slice(0, max);
}

// make a key safe to store and compare
function cleanOutcomeKey(value) {
  const key = String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  return key;
}

// clean step or null. bad shape is a rejection, we never patch it
export function validateGeneratedStep(data) {
  if (!data || typeof data !== 'object') return null;
  if (data.status === 'escalate') return null;

  const raw = data.step;
  if (!raw || typeof raw !== 'object') return null;

  const title = clean(raw.title, 120);
  const instruction = clean(raw.instruction, 600);
  if (!title || !instruction) return null;

  // no verb at all usually means a heading not an action
  if (instruction.length < 15) return null;

  const outcomes = [];
  const list = Array.isArray(data.outcomes) ? data.outcomes : [];
  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    if (!item || typeof item !== 'object') continue;
    const key = cleanOutcomeKey(item.key);
    const label = clean(item.label, 160);
    if (!key || !label) continue;
    // __ keys belong to the server, model does not get to claim them
    if (key.indexOf('__') === 0) continue;

    // hacky but works, list is tiny
    let duplicate = false;
    for (let j = 0; j < outcomes.length; j++) {
      if (outcomes[j].key === key) duplicate = true;
    }
    if (duplicate) continue;

    outcomes.push({ key: key, label: label });
  }

  // server adds two more later so one is enough from the model
  if (outcomes.length < 1) return null;

  // only low risk, anything higher is a refusal not a badge
  const riskLevel = String(raw.risk_level || raw.riskLevel || 'low').toLowerCase();
  if (riskLevel !== 'low') {
    console.log('[engine] step rejected, risk was', riskLevel);
    return null;
  }

  let estimatedSeconds = Number(raw.estimated_seconds || raw.estimatedSeconds);
  if (!isFinite(estimatedSeconds) || estimatedSeconds <= 0) estimatedSeconds = 45;
  if (estimatedSeconds > 300) estimatedSeconds = 300;

  return {
    title: title,
    instruction: instruction,
    why: clean(raw.why, 400),
    expectedObservation: clean(raw.expected_observation || raw.expectedObservation, 400),
    estimatedSeconds: Math.round(estimatedSeconds),
    riskLevel: 'low',
    outcomes: outcomes,
    problemSummary: clean(data.problem_summary || data.problemSummary, 300)
  };
}

// only continue and escalate count, anything else is invalid
export function readStatus(data) {
  if (!data || typeof data !== 'object') return 'invalid';
  if (data.status === 'continue') return 'continue';
  if (data.status === 'escalate') return 'escalate';
  return 'invalid';
}

export function readEscalationMessage(data) {
  const message = clean(data && data.escalation_message, 500);
  if (message) return message;
  return 'The assistant could not work out a safe next step for this problem.';
}

// check title and instruction together, mode picks which list
export function checkRisk(step, mode) {
  if (!step) return { ok: false, reason: 'the step was empty' };

  const haystack = step.title + ' ' + step.instruction + ' ' + (step.expectedObservation || '');

  for (let i = 0; i < FORBIDDEN_ANY.length; i++) {
    if (FORBIDDEN_ANY[i].pattern.test(haystack)) {
      console.log('[engine] blocked by rule:', FORBIDDEN_ANY[i].reason);
      return { ok: false, reason: FORBIDDEN_ANY[i].reason };
    }
  }

  if (mode !== 'explain') {
    for (let i = 0; i < FORBIDDEN_DEVICE.length; i++) {
      if (FORBIDDEN_DEVICE[i].pattern.test(haystack)) {
        return { ok: false, reason: FORBIDDEN_DEVICE[i].reason };
      }
    }
  }

  if (step.riskLevel !== 'low') {
    return { ok: false, reason: 'it was not marked as low risk' };
  }

  return { ok: true, reason: '' };
}

// words only and sorted, so two ways of saying the same thing match
export function actionSignature(text) {
  const words = String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/);

  const kept = [];
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if (word.length < 3) continue;
    if (STOP_WORDS.indexOf(word) !== -1) continue;
    if (kept.indexOf(word) === -1) kept.push(word);
  }
  kept.sort();
  return kept.join(' ');
}

function splitWords(sig) {
  if (!sig) return [];
  return sig.split(' ').filter(function (word) { return word !== ''; });
}

// how much two actions overlap, 0 to 1
export function similarity(a, b) {
  const left = splitWords(a);
  const right = splitWords(b);
  if (left.length === 0 || right.length === 0) return 0;

  let shared = 0;
  for (let i = 0; i < left.length; i++) {
    if (right.indexOf(left[i]) !== -1) shared = shared + 1;
  }

  const union = left.length + right.length - shared;
  if (union === 0) return 0;
  return shared / union;
}

// below this they just share words, above it the same action twice
export const REPEAT_THRESHOLD = 0.6;

export function findRepeatedStep(sig, prev) {
  if (!sig) return null;

  for (let i = 0; i < prev.length; i++) {
    const score = similarity(sig, prev[i]);
    if (score >= REPEAT_THRESHOLD) {
      return { index: i, score: score };
    }
  }
  return null;
}

// added after validation so every step has a way out. labels depend on mode
export function appendSystemOutcomes(outcomes, mode) {
  const list = outcomes.slice();
  list.push({ key: SYSTEM_OUTCOME_FIXED, label: FIXED_LABELS[mode] || FIXED_LABELS.dynamic });
  list.push({ key: SYSTEM_OUTCOME_OTHER, label: OTHER_LABELS[mode] || OTHER_LABELS.dynamic });
  return list;
}

export function isSystemOutcome(key) {
  return key === SYSTEM_OUTCOME_FIXED || key === SYSTEM_OUTCOME_OTHER;
}

export function hasRoomForAnotherStep(session) {
  return session.stepCount < session.maxSteps;
}

export { MAX_GENERATION_ATTEMPTS };

// keeps the \n. if someone pastes a numbered list we do not want one long line
function cleanBlock(value, max) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, max);
}

// only thing the user types freely so check it before it goes to the model
export function validateProblem(text) {
  const value = cleanBlock(text, 400);
  if (value.length < 10) {
    return { ok: false, message: 'Please describe the problem in a sentence or two.' };
  }
  return { ok: true, value: value };
}

export function validateInstructions(text) {
  const value = cleanBlock(text, MAX_INSTRUCTION_TEXT);
  if (value.length < 20) {
    return { ok: false, message: 'Please add a bit more of the instructions, or use a photo instead.' };
  }
  return { ok: true, value: value };
}

// heic left out on purpose, iphones send it and gemini cannot read it
const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

// base64 inflates the file, keep it under the body limit
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

const BASE64_ONLY = /^[A-Za-z0-9+/]+={0,2}$/;

export function validateImage(image) {
  if (!image || typeof image !== 'object') {
    return { ok: false, message: 'No picture was received.' };
  }

  let mimeType = String(image.mimeType || '').toLowerCase();
  if (mimeType === 'image/jpg') mimeType = 'image/jpeg';
  if (IMAGE_TYPES.indexOf(mimeType) === -1) {
    return { ok: false, message: 'That kind of picture is not supported. Please use a PNG or JPG.' };
  }

  const data = String(image.data || '');
  if (data.length < 100) {
    return { ok: false, message: 'That picture looks empty. Please try another one.' };
  }
  if (!BASE64_ONLY.test(data)) {
    return { ok: false, message: 'That picture could not be read. Please try another one.' };
  }

  // 4 chars per 3 bytes, this took me ages to figure out
  const bytes = Math.floor((data.length * 3) / 4);
  if (bytes > MAX_IMAGE_BYTES) {
    return { ok: false, message: 'That picture is too large. Please use one under 4 MB.' };
  }

  return { ok: true, image: { mimeType: mimeType, data: data } };
}

// one bad step does not kill the whole plan, drop it and warn
export function validateInstructionPlan(data) {
  if (!data || typeof data !== 'object') return null;

  // model is allowed to refuse, take it at face value
  if (data.status === 'refuse') {
    return {
      refused: true,
      message:
        clean(data.refusal_message, 400) ||
        'These instructions could not be turned into steps that are safe to follow.'
    };
  }

  const subject = clean(data.subject || data.problem_summary || data.summary, 300);
  if (!subject) return null;

  const list = Array.isArray(data.steps) ? data.steps : [];
  const steps = [];
  const warnings = [];
  let cutForLength = false;

  for (let i = 0; i < list.length; i++) {
    if (steps.length >= MAX_PLAN_STEPS) {
      cutForLength = true;
      break;
    }

    const raw = list[i];
    if (!raw || typeof raw !== 'object') continue;

    const title = clean(raw.title, 120);
    const instruction = clean(raw.instruction, 600);
    if (!title || instruction.length < 10) continue;

    // same low risk rule as a generated step
    const riskLevel = String(raw.risk_level || raw.riskLevel || 'low').toLowerCase();
    if (riskLevel !== 'low') {
      warnings.push('One step was left out because it was not marked as low risk.');
      continue;
    }

    let estimatedSeconds = Number(raw.estimated_seconds || raw.estimatedSeconds);
    if (!isFinite(estimatedSeconds) || estimatedSeconds <= 0) estimatedSeconds = 60;
    if (estimatedSeconds > 300) estimatedSeconds = 300;

    const step = {
      title: title,
      instruction: instruction,
      why: clean(raw.why, 400),
      expectedObservation: clean(raw.expected_observation || raw.expectedObservation, 400),
      estimatedSeconds: Math.round(estimatedSeconds),
      riskLevel: 'low',
      outcomes: PLAN_OUTCOMES.slice()
    };

    // anything-rules apply to a leaflet too, drop the step if it breaks them
    const risk = checkRisk(step, 'explain');
    if (!risk.ok) {
      warnings.push('One step was left out because it ' + risk.reason + '.');
      continue;
    }

    steps.push(step);
  }

  // nothing left is a refusal, not an empty plan
  if (steps.length === 0) return null;

  if (cutForLength) {
    warnings.push('These instructions were longer than ' + MAX_PLAN_STEPS + ' steps, so only the first part is shown.');
  }

  return { refused: false, subject: subject, steps: steps, warnings: warnings };
}
