import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

/**
 * Middleware factory that validates request body against a Zod schema.
 * Formats errors consistently as { error: string }.
 */
export const validateBody = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Return the first validation error message for clean client feedback
        const firstErrorMessage = error.errors[0]?.message || 'Invalid input data';
        res.status(400).json({ error: firstErrorMessage });
        return;
      }
      res.status(400).json({ error: 'Malformed request data' });
      return;
    }
  };
};

/**
 * Middleware factory that validates request params (e.g. :id) against a Zod schema.
 */
export const validateParams = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req.params = await schema.parseAsync(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const firstErrorMessage = error.errors[0]?.message || 'Invalid parameter';
        res.status(400).json({ error: firstErrorMessage });
        return;
      }
      res.status(400).json({ error: 'Invalid URL parameters' });
      return;
    }
  };
};
