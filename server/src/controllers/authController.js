import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { AUTH_COOKIE, cookieOptions, signToken } from '../middleware/auth.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// hand written so it is easy to follow
function validateSignup(body) {
  const errors = [];
  if (!body.displayName || body.displayName.trim().length < 2) {
    errors.push('Please enter a name with at least 2 characters');
  }
  if (!body.email || !EMAIL_PATTERN.test(body.email)) {
    errors.push('Please enter a valid email address');
  }
  if (!body.password || body.password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }
  return errors;
}

export async function register(req, res, next) {
  try {
    console.log('[api] register');
    const errors = validateSignup(req.body || {});
    if (errors.length > 0) {
      res.status(400).json({ error: { message: errors[0], details: errors, code: 'VALIDATION' } });
      return;
    }

    const email = req.body.email.toLowerCase().trim();
    const existing = await User.findOne({ email: email });
    if (existing) {
      res.status(409).json({ error: { message: 'An account with this email already exists', code: 'EMAIL_TAKEN' } });
      return;
    }

    const passwordHash = await bcrypt.hash(req.body.password, 10);
    const user = await User.create({
      displayName: req.body.displayName.trim(),
      email: email,
      passwordHash: passwordHash,
      authProvider: 'local',
      role: 'user'
    });

    const token = signToken(user);
    res.cookie(AUTH_COOKIE, token, cookieOptions());
    res.status(201).json({ user: user.toSafeJson(), token: token });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    console.log('[api] login');
    const email = (req.body.email || '').toLowerCase().trim();
    const password = req.body.password || '';

    if (!email || !password) {
      res.status(400).json({ error: { message: 'Email and password are required', code: 'VALIDATION' } });
      return;
    }

    const user = await User.findOne({ email: email });
    if (!user || !user.passwordHash) {
      res.status(401).json({ error: { message: 'Email or password is incorrect', code: 'BAD_CREDENTIALS' } });
      return;
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      res.status(401).json({ error: { message: 'Email or password is incorrect', code: 'BAD_CREDENTIALS' } });
      return;
    }

    user.lastActiveAt = new Date();
    await user.save();

    const token = signToken(user);
    res.cookie(AUTH_COOKIE, token, cookieOptions());
    res.json({ user: user.toSafeJson(), token: token });
  } catch (err) {
    next(err);
  }
}

export async function logout(req, res) {
  res.clearCookie(AUTH_COOKIE, cookieOptions());
  res.json({ ok: true });
}

export async function me(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404).json({ error: { message: 'Account not found', code: 'NOT_FOUND' } });
      return;
    }
    res.json({ user: user.toSafeJson() });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/auth/preferences   { reducedMotion }
// reducedMotion only, theme is skipped, id comes from the token so you can
// only change your own account
export async function updatePreferences(req, res, next) {
  try {
    const body = req.body || {};

    if (typeof body.reducedMotion !== 'boolean') {
      res.status(400).json({
        error: { message: 'reducedMotion must be true or false', code: 'VALIDATION' }
      });
      return;
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404).json({ error: { message: 'Account not found', code: 'NOT_FOUND' } });
      return;
    }

    user.preferences.reducedMotion = body.reducedMotion;
    user.lastActiveAt = new Date();
    await user.save();

    res.json({ user: user.toSafeJson() });
  } catch (err) {
    next(err);
  }
}
