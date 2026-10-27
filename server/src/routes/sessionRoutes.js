import express from 'express';
import {
  getSession,
  listSessions,
  postAbandon,
  postAttempt,
  postBack,
  postFeedback,
  postPause,
  postResolve,
  postResume,
  startSession,
  startExplainSession
} from '../controllers/sessionController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// every session route needs a token
router.use(requireAuth);

router.get('/', listSessions);
router.post('/', startSession);
// before /:id so explain is not read as a session id
router.post('/explain', startExplainSession);
router.get('/:id', getSession);
router.post('/:id/attempts', postAttempt);
router.post('/:id/back', postBack);
router.post('/:id/pause', postPause);
router.post('/:id/resume', postResume);
router.post('/:id/resolve', postResolve);
router.post('/:id/abandon', postAbandon);
router.post('/:id/feedback', postFeedback);

export default router;
