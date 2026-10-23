import request from 'supertest';
import path from 'path';
import fs from 'fs';
import app from '../src/app';
import { pool, closePool } from '../src/db';
import { signJwt } from '../src/utils/jwt';

describe('Loans & Summary API Endpoints', () => {
  let userA: { id: number; phone: string; token: string };
  let userB: { id: number; phone: string; token: string };
  let testImagePath: string;

  beforeAll(async () => {
    // Create test user A
    const phoneA = `+1777${Date.now().toString().slice(-7)}`;
    const resA = await pool.query(
      'INSERT INTO users (phone) VALUES ($1) RETURNING id, phone',
      [phoneA]
    );
    userA = {
      id: resA.rows[0].id,
      phone: resA.rows[0].phone,
      token: signJwt({ userId: resA.rows[0].id, phone: resA.rows[0].phone }),
    };

    // Create test user B
    const phoneB = `+1888${Date.now().toString().slice(-7)}`;
    const resB = await pool.query(
      'INSERT INTO users (phone) VALUES ($1) RETURNING id, phone',
      [phoneB]
    );
    userB = {
      id: resB.rows[0].id,
      phone: resB.rows[0].phone,
      token: signJwt({ userId: resB.rows[0].id, phone: resB.rows[0].phone }),
    };

    // Create a temporary dummy image file for receipt testing
    testImagePath = path.join(__dirname, 'test-receipt.png');
    // Minimal valid 1x1 PNG binary buffer
    const pngBuffer = Buffer.from(
      '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2d0000000049454e44ae426082',
      'hex'
    );
    fs.writeFileSync(testImagePath, pngBuffer);
  });

  afterAll(async () => {
    // Clean up temporary image
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }

    // Clean up test users & their cascade deleted loans
    if (userA) {
      await pool.query('DELETE FROM users WHERE id = $1', [userA.id]);
    }
    if (userB) {
      await pool.query('DELETE FROM users WHERE id = $1', [userB.id]);
    }

    await closePool();
  });

  describe('Authentication Security', () => {
    it('should return 401 when no authorization header is provided', async () => {
      const res = await request(app).get('/loans');
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    it('should return 401 when an invalid token is provided', async () => {
      const res = await request(app)
        .get('/loans')
        .set('Authorization', 'Bearer invalid-token-xyz');
      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/invalid|expired/i);
    });
  });

  describe('POST /loans (Validation & Creation)', () => {
    it('should reject invalid inputs with 400 and descriptive Zod errors', async () => {
      // Negative amount
      const res1 = await request(app)
        .post('/loans')
        .set('Authorization', `Bearer ${userA.token}`)
        .send({
          friendName: 'Charlie',
          amount: -50,
          dueDate: '2027-01-01',
        });
      expect(res1.status).toBe(400);
      expect(res1.body.error).toMatch(/greater than zero/i);

      // Invalid date format
      const res2 = await request(app)
        .post('/loans')
        .set('Authorization', `Bearer ${userA.token}`)
        .send({
          friendName: 'Charlie',
          amount: 100,
          dueDate: 'invalid-date',
        });
      expect(res2.status).toBe(400);
      expect(res2.body.error).toMatch(/format|calendar date/i);

      // Missing friend name
      const res3 = await request(app)
        .post('/loans')
        .set('Authorization', `Bearer ${userA.token}`)
        .send({
          friendName: '',
          amount: 100,
          dueDate: '2027-01-01',
        });
      expect(res3.status).toBe(400);
      expect(res3.body.error).toMatch(/empty/i);
    });

    it('should create a new loan and return 201 with correct fields', async () => {
      const res = await request(app)
        .post('/loans')
        .set('Authorization', `Bearer ${userA.token}`)
        .send({
          friendName: 'Dave',
          amount: 250.75,
          dueDate: '2030-05-15',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.friendName).toBe('Dave');
      expect(res.body.amount).toBe(250.75);
      expect(res.body.dueDate).toBe('2030-05-15');
      expect(res.body.status).toBe('pending');
      expect(res.body.isOverdue).toBe(false);
      expect(res.body.userId).toBe(userA.id);
    });
  });

  describe('Multi-Tenant Isolation & Computed Overdue Flag', () => {
    let loanAFutureId: number;
    let loanAPastId: number;

    beforeAll(async () => {
      // Create a future loan for User A
      const resFuture = await request(app)
        .post('/loans')
        .set('Authorization', `Bearer ${userA.token}`)
        .send({
          friendName: 'Eve (Future)',
          amount: 100,
          dueDate: '2099-01-01',
        });
      loanAFutureId = resFuture.body.id;

      // Create an overdue loan for User A
      const resPast = await request(app)
        .post('/loans')
        .set('Authorization', `Bearer ${userA.token}`)
        .send({
          friendName: 'Frank (Past)',
          amount: 60,
          dueDate: '2020-01-01',
        });
      loanAPastId = resPast.body.id;

      // Create a loan for User B
      await request(app)
        .post('/loans')
        .set('Authorization', `Bearer ${userB.token}`)
        .send({
          friendName: 'Grace',
          amount: 300,
          dueDate: '2029-01-01',
        });
    });

    it("User A's loans should reflect proper overdue computation", async () => {
      const res = await request(app)
        .get('/loans')
        .set('Authorization', `Bearer ${userA.token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);

      const futureLoan = res.body.find((l: any) => l.id === loanAFutureId);
      const pastLoan = res.body.find((l: any) => l.id === loanAPastId);

      expect(futureLoan.isOverdue).toBe(false);
      expect(pastLoan.isOverdue).toBe(true);
    });

    it("User B cannot see User A's loans", async () => {
      const resB = await request(app)
        .get('/loans')
        .set('Authorization', `Bearer ${userB.token}`);

      expect(resB.status).toBe(200);
      expect(resB.body.length).toBe(1);
      expect(resB.body[0].friendName).toBe('Grace');
      expect(resB.body[0].userId).toBe(userB.id);

      // Verify none of User A's loans are in User B's result
      const idsB = resB.body.map((l: any) => l.id);
      expect(idsB).not.toContain(loanAFutureId);
      expect(idsB).not.toContain(loanAPastId);
    });

    it("User B cannot repay User A's loan (returns 404)", async () => {
      const res = await request(app)
        .patch(`/loans/${loanAFutureId}/repay`)
        .set('Authorization', `Bearer ${userB.token}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Loan not found');
    });

    it('User A can mark loan as repaid (200), and cannot repay again (409)', async () => {
      // Repay loan
      const repayRes = await request(app)
        .patch(`/loans/${loanAFutureId}/repay`)
        .set('Authorization', `Bearer ${userA.token}`);

      expect(repayRes.status).toBe(200);
      expect(repayRes.body.status).toBe('repaid');
      expect(repayRes.body.repaidAt).not.toBeNull();
      expect(repayRes.body.isOverdue).toBe(false);

      // Attempt second repayment (must return 409 Conflict)
      const duplicateRepayRes = await request(app)
        .patch(`/loans/${loanAFutureId}/repay`)
        .set('Authorization', `Bearer ${userA.token}`);

      expect(duplicateRepayRes.status).toBe(409);
      expect(duplicateRepayRes.body.error).toMatch(/already.*repaid/i);
    });
  });

  describe('GET /loans/summary (SQL Math)', () => {
    it('should compute exact totalLent, totalRepaid, and overdueAmount for the user', async () => {
      // Create dedicated user C to test math in isolation
      const phoneC = `+1999${Date.now().toString().slice(-7)}`;
      const resC = await pool.query(
        'INSERT INTO users (phone) VALUES ($1) RETURNING id, phone',
        [phoneC]
      );
      const userC = {
        id: resC.rows[0].id,
        phone: resC.rows[0].phone,
        token: signJwt({ userId: resC.rows[0].id, phone: resC.rows[0].phone }),
      };

      // 1. Pending loan in future: 100
      await request(app)
        .post('/loans')
        .set('Authorization', `Bearer ${userC.token}`)
        .send({ friendName: 'P1', amount: 100, dueDate: '2099-01-01' });

      // 2. Pending loan overdue: 75
      await request(app)
        .post('/loans')
        .set('Authorization', `Bearer ${userC.token}`)
        .send({ friendName: 'P2', amount: 75, dueDate: '2020-01-01' });

      // 3. Repaid loan: 50
      const repaidLoan = await request(app)
        .post('/loans')
        .set('Authorization', `Bearer ${userC.token}`)
        .send({ friendName: 'P3', amount: 50, dueDate: '2020-01-01' });
      await request(app)
        .patch(`/loans/${repaidLoan.body.id}/repay`)
        .set('Authorization', `Bearer ${userC.token}`);

      // Verify Summary:
      // totalLent = 100 + 75 + 50 = 225
      // totalRepaid = 50
      // overdueAmount = 75 (only pending overdue, not repaid overdue)
      const summaryRes = await request(app)
        .get('/loans/summary')
        .set('Authorization', `Bearer ${userC.token}`);

      expect(summaryRes.status).toBe(200);
      expect(summaryRes.body.totalLent).toBe(225);
      expect(summaryRes.body.totalRepaid).toBe(50);
      expect(summaryRes.body.overdueAmount).toBe(75);

      // Clean up user C
      await pool.query('DELETE FROM users WHERE id = $1', [userC.id]);
    });
  });

  describe('POST /loans/:id/receipt (Receipt Upload)', () => {
    let loanId: number;

    beforeAll(async () => {
      const res = await request(app)
        .post('/loans')
        .set('Authorization', `Bearer ${userA.token}`)
        .send({ friendName: 'ReceiptFriend', amount: 45, dueDate: '2028-01-01' });
      loanId = res.body.id;
    });

    it('should reject receipt upload if user does not own the loan (404)', async () => {
      const res = await request(app)
        .post(`/loans/${loanId}/receipt`)
        .set('Authorization', `Bearer ${userB.token}`)
        .attach('receipt', testImagePath);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Loan not found');
    });

    it('should successfully upload receipt image and update loan record', async () => {
      const res = await request(app)
        .post(`/loans/${loanId}/receipt`)
        .set('Authorization', `Bearer ${userA.token}`)
        .attach('receipt', testImagePath);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(loanId);
      expect(res.body.receiptUrl).toMatch(/^\/uploads\/receipt-.*\.png$/);

      // Verify the file was physically saved to disk
      const uploadedFilename = path.basename(res.body.receiptUrl);
      const diskPath = path.join(__dirname, '../uploads', uploadedFilename);
      expect(fs.existsSync(diskPath)).toBe(true);

      // Clean up uploaded test file
      if (fs.existsSync(diskPath)) {
        fs.unlinkSync(diskPath);
      }
    });
  });
});
