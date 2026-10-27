// tiny in memory rate limiter for the ai routes. fine for one server, a real
// deployment would need a shared store
export function simpleRateLimit(options) {
  const windowMs = (options && options.windowMs) || 60 * 1000;
  const max = (options && options.max) || 20;
  const hits = new Map();

  return function limiter(req, res, next) {
    const who = req.user ? 'u:' + req.user.id : 'ip:' + (req.ip || 'unknown');
    const key = who + ':' + req.baseUrl;
    const now = Date.now();

    let rec = hits.get(key);
    if (!rec || now - rec.start > windowMs) {
      rec = { count: 0, start: now };
    }
    rec.count = rec.count + 1;
    hits.set(key, rec);

    if (rec.count > max) {
      res.status(429).json({
        error: { message: 'Too many requests. Please wait a moment and try again.', code: 'RATE_LIMITED' }
      });
      return;
    }
    next();
  };
}
