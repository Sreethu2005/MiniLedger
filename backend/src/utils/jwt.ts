import jwt from 'jsonwebtoken';
import { AuthUser } from '../types/express';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_miniledger_jwt_key_change_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30d';

/**
 * Generate a signed JWT token containing userId and phone
 */
export const signJwt = (payload: AuthUser): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: (process.env.JWT_EXPIRES_IN || '30d') as any,
  });
};

/**
 * Verify and decode a JWT token.
 * Throws an error if the token is invalid or expired.
 */
export const verifyJwt = (token: string): AuthUser => {
  return jwt.verify(token, JWT_SECRET) as AuthUser;
};
