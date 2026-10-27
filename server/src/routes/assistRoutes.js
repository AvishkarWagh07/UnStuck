import express from 'express';
import { explain, summarize } from '../controllers/assistController.js';
import { requireAuth } from '../middleware/auth.js';
import { simpleRateLimit } from '../middleware/rateLimit.js';

const router = express.Router();

// ai routes need a signed in user
router.use(requireAuth);

// ai calls are limited on their own
const limiter = simpleRateLimit({ windowMs: 60 * 1000, max: 20 });

router.post('/explain', limiter, explain);
router.post('/summarize', limiter, summarize);

export default router;
