import mongoose from 'mongoose';
import { ASSIST_TYPES } from '../config/constants.js';

// log of every ai call, we keep a short summary of the input not the raw text
const geminiInteractionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'GuideSession' },
    stepKey: { type: String },
    interactionType: { type: String, enum: ASSIST_TYPES, required: true },
    inputSummary: { type: String, maxlength: 500 },
    output: { type: mongoose.Schema.Types.Mixed },
    model: { type: String },
    // unavailable = gemini was down, failed = bad answer, rejected = engine
    // threw the answer away
    status: { type: String, enum: ['success', 'rejected', 'failed', 'unavailable'], default: 'success' },
    usedFallback: { type: Boolean, default: false }
  },
  { timestamps: true }
);

geminiInteractionSchema.index({ sessionId: 1, createdAt: -1 });
geminiInteractionSchema.index({ userId: 1, createdAt: -1 });

const GeminiInteraction = mongoose.model('GeminiInteraction', geminiInteractionSchema);

export default GeminiInteraction;
