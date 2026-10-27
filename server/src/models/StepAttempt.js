import mongoose from 'mongoose';
import { ATTEMPT_SOURCE } from '../config/constants.js';

// every answer the user gives is stored as an attempt, own collection keeps
// the session document small
const stepAttemptSchema = new mongoose.Schema(
  {
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'GuideSession', required: true, index: true },
    stepKey: { type: String, required: true },
    attemptNumber: { type: Number, default: 1 },
    selectedOutcome: { type: String, required: true },
    notes: { type: String, trim: true, maxlength: 500 },
    durationSeconds: { type: Number },
    attemptedAt: { type: Date, default: Date.now },
    source: { type: String, enum: ATTEMPT_SOURCE, default: 'user' },
    // small allowlisted diagnostics only, nothing sensitive
    metadata: { type: mongoose.Schema.Types.Mixed }
  },
  { timestamps: true }
);

stepAttemptSchema.index({ sessionId: 1, attemptedAt: 1 });
stepAttemptSchema.index({ sessionId: 1, stepKey: 1 });

const StepAttempt = mongoose.model('StepAttempt', stepAttemptSchema);

export default StepAttempt;
