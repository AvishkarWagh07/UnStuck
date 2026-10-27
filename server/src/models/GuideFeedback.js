import mongoose from 'mongoose';
import { FEEDBACK_RESULTS } from '../config/constants.js';

// feedback goes on a session not a guide, the steps were made for that one run
const guideFeedbackSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'GuideSession', required: true },
    rating: { type: Number, min: 1, max: 5 },
    result: { type: String, enum: FEEDBACK_RESULTS, required: true },
    // step that felt confusing, if the user picked one
    confusingStepKey: { type: String },
    comment: { type: String, trim: true, maxlength: 800 }
  },
  { timestamps: true }
);

guideFeedbackSchema.index({ sessionId: 1 });

const GuideFeedback = mongoose.model('GuideFeedback', guideFeedbackSchema);

export default GuideFeedback;
