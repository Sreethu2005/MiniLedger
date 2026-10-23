import { Request, Response } from 'express';
import { query } from '../db';

/**
 * Format a database loan row into a clean JSON response object
 */
export const formatLoanRow = (row: any) => ({
  id: row.id,
  userId: row.user_id,
  friendName: row.friend_name,
  amount: Number(row.amount),
  dueDate: row.due_date instanceof Date ? row.due_date.toISOString().split('T')[0] : row.due_date,
  status: row.status,
  repaidAt: row.repaid_at,
  receiptUrl: row.receipt_url,
  createdAt: row.created_at,
  isOverdue: Boolean(row.is_overdue ?? (row.status === 'pending' && new Date(row.due_date) < new Date())),
});

/**
 * POST /loans
 * Body: { friendName, amount, dueDate }
 * Creates a new loan under the authenticated user.
 */
export const createLoan = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'User is not authenticated' });
      return;
    }

    const { friendName, amount, dueDate } = req.body;

    if (!friendName || typeof friendName !== 'string' || friendName.trim().length === 0) {
      res.status(400).json({ error: 'Friend name is required' });
      return;
    }

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      res.status(400).json({ error: 'Amount must be a positive number' });
      return;
    }

    if (!dueDate || isNaN(Date.parse(dueDate))) {
      res.status(400).json({ error: 'A valid due date is required (YYYY-MM-DD)' });
      return;
    }

    const result = await query(
      `INSERT INTO loans (user_id, friend_name, amount, due_date, status, created_at)
       VALUES ($1, $2, $3, $4, 'pending', NOW())
       RETURNING 
         id, user_id, friend_name, amount, due_date, status, repaid_at, receipt_url, created_at,
         (CASE WHEN due_date < CURRENT_DATE THEN true ELSE false END) AS is_overdue`,
      [userId, friendName.trim(), parsedAmount, dueDate]
    );

    const loan = formatLoanRow(result.rows[0]);
    res.status(201).json(loan);
  } catch (error: any) {
    console.error('Error creating loan:', error);
    res.status(500).json({ error: 'Failed to create loan record' });
  }
};

/**
 * GET /loans
 * Returns all loans for the authenticated user, newest first,
 * with a computed isOverdue flag.
 */
export const getLoans = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'User is not authenticated' });
      return;
    }

    const result = await query(
      `SELECT 
         id,
         user_id,
         friend_name,
         amount,
         due_date,
         status,
         repaid_at,
         receipt_url,
         created_at,
         CASE 
           WHEN status = 'pending' AND due_date < CURRENT_DATE THEN true 
           ELSE false 
         END AS is_overdue
       FROM loans
       WHERE user_id = $1
       ORDER BY created_at DESC, id DESC`,
      [userId]
    );

    const loans = result.rows.map(formatLoanRow);
    res.status(200).json(loans);
  } catch (error: any) {
    console.error('Error fetching loans:', error);
    res.status(500).json({ error: 'Failed to fetch loans' });
  }
};

/**
 * PATCH /loans/:id/repay
 * Marks loan as repaid and sets repaid_at timestamp.
 * Returns 404 if not found or not owned by user.
 * Returns 409 if already repaid.
 */
export const repayLoan = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'User is not authenticated' });
      return;
    }

    const loanId = parseInt(req.params.id, 10);
    if (isNaN(loanId)) {
      res.status(400).json({ error: 'Invalid loan ID parameter' });
      return;
    }

    // Check if loan exists
    const checkResult = await query(
      `SELECT * FROM loans WHERE id = $1`,
      [loanId]
    );

    // 404 if loan does not exist OR belongs to another user
    if (checkResult.rowCount === 0 || checkResult.rows[0].user_id !== userId) {
      res.status(404).json({ error: 'Loan not found' });
      return;
    }

    const existingLoan = checkResult.rows[0];

    // 409 if loan is already repaid
    if (existingLoan.status === 'repaid') {
      res.status(409).json({ error: 'Loan is already marked as repaid' });
      return;
    }

    // Update status to 'repaid' and record current timestamp
    const updateResult = await query(
      `UPDATE loans
       SET status = 'repaid', repaid_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING 
         id, user_id, friend_name, amount, due_date, status, repaid_at, receipt_url, created_at,
         false AS is_overdue`,
      [loanId, userId]
    );

    const updatedLoan = formatLoanRow(updateResult.rows[0]);
    res.status(200).json(updatedLoan);
  } catch (error: any) {
    console.error('Error marking loan as repaid:', error);
    res.status(500).json({ error: 'Failed to mark loan as repaid' });
  }
};

/**
 * GET /loans/summary
 * Computes financial summary in PostgreSQL:
 * - totalLent: sum of all loans
 * - totalRepaid: sum of repaid loans
 * - overdueAmount: sum of pending loans past due date
 */
export const getLoanSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'User is not authenticated' });
      return;
    }

    // Compute all three metrics in a single aggregation query using SQL CASE expressions
    const result = await query(
      `SELECT
         COALESCE(SUM(amount), 0) AS total_lent,
         COALESCE(SUM(CASE WHEN status = 'repaid' THEN amount ELSE 0 END), 0) AS total_repaid,
         COALESCE(SUM(CASE WHEN status = 'pending' AND due_date < CURRENT_DATE THEN amount ELSE 0 END), 0) AS overdue_amount
       FROM loans
       WHERE user_id = $1`,
      [userId]
    );

    const summaryRow = result.rows[0];

    res.status(200).json({
      totalLent: Number(summaryRow.total_lent),
      totalRepaid: Number(summaryRow.total_repaid),
      overdueAmount: Number(summaryRow.overdue_amount),
    });
  } catch (error: any) {
    console.error('Error fetching loan summary:', error);
    res.status(500).json({ error: 'Failed to calculate loan summary' });
  }
};

/**
 * POST /loans/:id/receipt
 * Uploads an image receipt for a loan using Multer.
 * Stores the receipt URL in the database.
 */
export const uploadReceipt = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'User is not authenticated' });
      return;
    }

    const loanId = parseInt(req.params.id, 10);
    if (isNaN(loanId)) {
      res.status(400).json({ error: 'Invalid loan ID parameter' });
      return;
    }

    // Verify loan exists and is owned by current user
    const checkResult = await query(
      `SELECT * FROM loans WHERE id = $1`,
      [loanId]
    );

    if (checkResult.rowCount === 0 || checkResult.rows[0].user_id !== userId) {
      // Remove uploaded file if loan is not found/not owned
      if (req.file) {
        try {
          const fs = await import('fs');
          fs.unlinkSync(req.file.path);
        } catch (_) {}
      }
      res.status(404).json({ error: 'Loan not found' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: 'Please attach an image receipt file' });
      return;
    }

    // Relative receipt URL for static serving
    const receiptUrl = `/uploads/${req.file.filename}`;

    const updateResult = await query(
      `UPDATE loans
       SET receipt_url = $1
       WHERE id = $2 AND user_id = $3
       RETURNING 
         id, user_id, friend_name, amount, due_date, status, repaid_at, receipt_url, created_at,
         (CASE WHEN status = 'pending' AND due_date < CURRENT_DATE THEN true ELSE false END) AS is_overdue`,
      [receiptUrl, loanId, userId]
    );

    const updatedLoan = formatLoanRow(updateResult.rows[0]);
    res.status(200).json(updatedLoan);
  } catch (error: any) {
    console.error('Error uploading receipt:', error);
    res.status(500).json({ error: 'Failed to upload receipt' });
  }
};

