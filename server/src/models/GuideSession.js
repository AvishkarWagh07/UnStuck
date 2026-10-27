import mongoose from 'mongoose';
import {
  SESSION_MODES,
  SESSION_STATUS,
  SOURCE_KINDS,
  MAX_SESSION_STEPS,
  MAX_INSTRUCTION_TEXT
} from '../config/constants.js';

// one step of a plan the model read out of the user's instructions. same shape
// as a generated step so the app cannot tell them apart
const planStepSchema = new mongoose.Schema(
  {
    title: { type: String, maxlength: 120 },
    instruction: { type: String, maxlength: 600 },
    why: { type: String, maxlength: 400 },
    expectedObservation: { type: String, maxlength: 400 },
    estimatedSeconds: { type: Number },
    riskLevel: { type: String },
    outcomes: [{ key: { type: String }, label: { type: String } }]
  },
  { _id: false }
);

// one person working one problem. the steps live in TroubleshootStep, not here
const guideSessionSchema = new mongoose.Schema(
  {
    // no anonymous mode, every session has an account
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    mode: { type: String, enum: SESSION_MODES, default: 'dynamic' },

    // the user's own words, kept as typed, never rewritten. in explain mode it
    // holds the summary instead because the full text is too long
    problemStatement: { type: String, required: true, trim: true, maxlength: 400 },

    // explain mode only - where the instructions came from
    sourceKind: { type: String, enum: SOURCE_KINDS },

    // the pasted text, only text sessions keep this, photos are thrown away
    sourceText: { type: String, maxlength: MAX_INSTRUCTION_TEXT },

    // steps read from the instructions, handed over one at a time
    plan: { type: [planStepSchema], default: undefined },

    // how far into the plan we are
    planIndex: { type: Number, default: 0 },

    // steps left out of the plan and why, so the user is told
    planWarnings: [{ type: String, maxlength: 300 }],

    status: { type: String, enum: SESSION_STATUS, default: 'in_progress', index: true },
    currentStepKey: { type: String },
    visitedStepKeys: [{ type: String }],

    // engine stops offering steps after maxSteps instead of looping
    stepCount: { type: Number, default: 0 },
    maxSteps: { type: Number, default: MAX_SESSION_STEPS },

    // user says it is fixed and we are asking them to confirm
    pendingConfirmation: { type: Boolean, default: false },

    // set when the engine stepped in, so the ui can say why
    lastNotice: {
      kind: { type: String },
      message: { type: String, maxlength: 500 }
    },

    startedAt: { type: Date, default: Date.now },
    lastActivityAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    resolutionConfirmed: { type: Boolean, default: false },
    summary: { type: String, trim: true }
  },
  { timestamps: true }
);

guideSessionSchema.index({ userId: 1, lastActivityAt: -1 });

const GuideSession = mongoose.model('GuideSession', guideSessionSchema);

export default GuideSession;
