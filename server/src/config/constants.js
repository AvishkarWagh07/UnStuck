// shared enums, kept in one place so the models stay consistent

export const RISK_LEVELS = ['low', 'moderate', 'high'];

export const SESSION_STATUS = [
  'in_progress',
  'paused',
  'resolved',
  'unresolved',
  'escalated',
  'abandoned'
];

export const ATTEMPT_SOURCE = ['user', 'recovery'];

// the kinds of ai call we log. readInstructions reads a photo or pasted text
// and turns it into a short plan
export const ASSIST_TYPES = ['explain', 'summarize', 'nextStep', 'readInstructions'];

// dynamic = model writes steps as we go, explain = read once from instructions
export const SESSION_MODES = ['dynamic', 'explain'];

// where the explain instructions came from
export const SOURCE_KINDS = ['text', 'photo'];

// the engine's own limits, the model does not pick these
export const MAX_SESSION_STEPS = 12;
export const MAX_GENERATION_ATTEMPTS = 2;

// a plan is one person's instructions, not a whole manual
export const MAX_PLAN_STEPS = 10;

// limit on the pasted text, different from the 400 char problem statement
export const MAX_INSTRUCTION_TEXT = 6000;

// fixed choices so every plan step looks the same
export const PLAN_OUTCOMES = [
  { key: 'done', label: 'Done, what is next' },
  { key: 'stuck', label: 'I could not do this step' }
];

// server adds these two so the user can always finish or ask for help
export const SYSTEM_OUTCOME_FIXED = '__fixed';
export const SYSTEM_OUTCOME_OTHER = '__something_else';

export const FIXED_LABELS = {
  dynamic: 'That fixed it',
  explain: 'That is everything, thank you'
};

export const OTHER_LABELS = {
  dynamic: 'Something else happened',
  explain: 'This step is not working out'
};

export const FEEDBACK_RESULTS = ['solved', 'partly_solved', 'not_solved'];
