import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'unstuck_dev_secret_change_me';
const EXPIRES = process.env.JWT_EXPIRES_IN || '7d';
export const AUTH_COOKIE = 'unstuck_token';

export function signToken(user) {
  return jwt.sign({ sub: String(user._id), role: user.role }, SECRET, { expiresIn: EXPIRES });
}

// runs on every request, reads the token from the cookie first then the header
export function attachActor(req, res, next) {
  req.user = null;

  let token = null;
  if (req.cookies && req.cookies[AUTH_COOKIE]) {
    token = req.cookies[AUTH_COOKIE];
  }
  const header = req.headers.authorization;
  if (!token && header && header.indexOf('Bearer ') === 0) {
    token = header.slice(7);
  }

  if (token) {
    try {
      const payload = jwt.verify(token, SECRET);
      req.user = { id: payload.sub, role: payload.role };
    } catch (err) {
      req.user = null;
    }
  }

  next();
}

export function requireAuth(req, res, next) {
  if (!req.user) {
    res.status(401).json({ error: { message: 'Please sign in to continue', code: 'AUTH_REQUIRED' } });
    return;
  }
  next();
}

export function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/'
  };
}
