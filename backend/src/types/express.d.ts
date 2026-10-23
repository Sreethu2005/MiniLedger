// Extend Express Request interface to include authenticated user data
export interface AuthUser {
  userId: number;
  phone: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
