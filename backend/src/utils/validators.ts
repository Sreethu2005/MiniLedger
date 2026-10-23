import { z } from 'zod';

/**
 * Zod schema for requesting OTP
 */
export const requestOtpSchema = z.object({
  phone: z
    .string({ required_error: 'Phone number is required' })
    .trim()
    .min(8, 'Phone number must be at least 8 characters')
    .max(20, 'Phone number must not exceed 20 characters')
    .regex(/^\+?[0-9\s\-()]+$/, 'Phone number must contain valid digits'),
});

/**
 * Zod schema for verifying OTP
 */
export const verifyOtpSchema = z.object({
  phone: z
    .string({ required_error: 'Phone number is required' })
    .trim()
    .min(8, 'Phone number must be at least 8 characters'),
  otp: z
    .string({ required_error: 'OTP code is required' })
    .trim()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain only digits'),
});

/**
 * Zod schema for creating a new loan
 */
export const createLoanSchema = z.object({
  friendName: z
    .string({ required_error: 'Friend name is required' })
    .trim()
    .min(1, 'Friend name cannot be empty')
    .max(100, 'Friend name cannot exceed 100 characters'),
  amount: z.preprocess(
    (val) => (typeof val === 'string' ? parseFloat(val) : val),
    z
      .number({ required_error: 'Amount is required', invalid_type_error: 'Amount must be a number' })
      .positive('Amount must be greater than zero')
      .max(1000000000, 'Amount exceeds maximum allowable limit')
  ),
  dueDate: z
    .string({ required_error: 'Due date is required' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must follow YYYY-MM-DD format')
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'Due date must be a valid calendar date',
    }),
});

/**
 * Zod schema for loan ID parameter in URL
 */
export const loanIdParamSchema = z.object({
  id: z.preprocess(
    (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
    z.number().int().positive('Loan ID must be a positive integer')
  ),
});
