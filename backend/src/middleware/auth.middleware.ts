import { Request, Response, NextFunction } from 'express';
import { verifyJwt } from '../utils/jwt';

/**
 * Authentication Middleware:
 * Inspects incoming request headers for a valid Bearer JWT.
 * Decodes the token and attaches the authenticated user to `req.user`.
 * If missing or invalid, halts execution with HTTP 401 Unauthorized.
 */
export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  // Verify presence of Authorization header and 'Bearer <token>' format
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authorization header missing or invalid format (Bearer token expected)' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyJwt(token);
    req.user = decoded; // { userId, phone }
    next();
  } catch (err: any) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }
};
