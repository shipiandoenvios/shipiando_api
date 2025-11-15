import { RequestHandler } from 'express';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export const csrfMiddleware: RequestHandler = (req, res, next) => {
  try {
    // Only check CSRF for mutating methods
    if (!MUTATING_METHODS.has(req.method)) return next();

    const cookieName = process.env.AUTH_CSRF_COOKIE_NAME || 'sopy-csrf';
    const headerToken = req.headers['x-csrf-token'] as string | undefined;
    const cookieToken = req.cookies?.[cookieName];

    // If no cookie token set, allow (this can happen for public endpoints) — but prefer blocking
    if (!cookieToken) {
      res.status(403).json({ success: false, message: 'CSRF token missing' });
      return;
    }

    if (!headerToken || headerToken !== cookieToken) {
      res.status(403).json({ success: false, message: 'Invalid CSRF token' });
      return;
    }

    next();
  } catch (err) {
    res.status(500).json({ success: false, message: 'CSRF middleware error' });
    return;
  }
};

export default csrfMiddleware;
