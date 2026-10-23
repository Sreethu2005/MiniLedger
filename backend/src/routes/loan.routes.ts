import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { validateBody, validateParams } from '../middleware/validate.middleware';
import { uploadReceiptMiddleware } from '../middleware/upload.middleware';
import { createLoanSchema, loanIdParamSchema } from '../utils/validators';
import {
  createLoan,
  getLoans,
  repayLoan,
  getLoanSummary,
  uploadReceipt,
} from '../controllers/loan.controller';

const router = Router();

// Protect all /loans routes with JWT authentication middleware
router.use(requireAuth);

// Summary route (must be declared BEFORE :id routes to prevent URL param collision)
router.get('/summary', getLoanSummary);

// Collection routes
router.post('/', validateBody(createLoanSchema), createLoan);
router.get('/', getLoans);

// Item action routes
router.patch('/:id/repay', validateParams(loanIdParamSchema), repayLoan);

// Receipt upload route (multipart/form-data with field 'receipt')
router.post(
  '/:id/receipt',
  validateParams(loanIdParamSchema),
  uploadReceiptMiddleware,
  uploadReceipt
);

export default router;
