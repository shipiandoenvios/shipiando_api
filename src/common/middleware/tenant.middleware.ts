import { RequestHandler } from 'express';

export const tenantMiddleware: RequestHandler = (req, res, next) => {
  try {
    const headerClient =
      typeof req.headers['x-client-id'] === 'string'
        ? req.headers['x-client-id']
        : undefined;
    const user = (req as { user?: { clientId?: string } }).user;
    const clientId = user?.clientId || headerClient;
    (req as { clientId?: string }).clientId = clientId;
    next();
  } catch {
    next();
  }
};

export default tenantMiddleware;
