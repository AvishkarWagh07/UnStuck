import mongoose from 'mongoose';
import { RISK_LEVELS } from '../config/constants.js';

// saved the moment it is shown. refresh must show the same step again, and the
// engine needs the list already shown for loop detection
const troubleshootStepSchema = new mongoose.Schema(
  {
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'GuideSession', required: true, index: true },
    stepKey: { type: String, required: true },
    stepNumber: { type: Number, required: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    instruction: { type: String, required: true, trim: true, maxlength: 600 },
    why: { type: String, trim: true, maxlength: 400 },
    expectedObservation: { type: String, trim: true, maxlength: 400 },
    estimatedSeconds: { type: Number, default: 45 },
    riskLevel: { type: String, enum: RISK_LEVELS, default: 'low' },
    outcomes: [
      {
        key: { type: String, required: true },
        label: { type: String, required: true, trim: true, maxlength: 160 }
      }
    ],
    // normalised instruction text, used for loop detection
    actionSignature: { type: String },
    // the model's own reasoning, kept for the record
    problemSummary: { type: String, trim: true, maxlength: 300 },
    model: { type: String },
    // true when the first try was rejected and generated again
    wasRegenerated: { type: Boolean, default: false }
  },
  { timestamps: true }
);

troubleshootStepSchema.index({ sessionId: 1, stepNumber: 1 });

const TroubleshootStep = mongoose.model('TroubleshootStep', troubleshootStepSchema);

export default TroubleshootStep;
