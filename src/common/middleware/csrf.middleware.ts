import { RequestHandler } from 'express';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export const csrfMiddleware: RequestHandler = (req, res, next) => {
  try {
    if (!MUTATING_METHODS.has(req.method)) return next();
    const cookieName = process.env.AUTH_CSRF_COOKIE_NAME || 'sopy-csrf';
    const headerToken =
      typeof req.headers['x-csrf-token'] === 'string'
        ? req.headers['x-csrf-token']
        : undefined;
    const cookies: Record<string, string> =
      req.cookies && typeof req.cookies === 'object'
        ? (req.cookies as Record<string, string>)
        : {};
    const cookieToken = cookies[cookieName];
    if (!cookieToken) {
      res.status(403).json({ success: false, message: 'CSRF token missing' });
      return;
    }
    if (!headerToken || headerToken !== cookieToken) {
      res.status(403).json({ success: false, message: 'Invalid CSRF token' });
      return;
    }
    next();
  } catch {
    res.status(500).json({ success: false, message: 'CSRF middleware error' });
  }
};

export default csrfMiddleware;
