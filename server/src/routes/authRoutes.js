import express from 'express';
import { login, logout, me, register, updatePreferences } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', requireAuth, me);

// the only account setting we actually use
router.patch('/preferences', requireAuth, updatePreferences);

export default router;
