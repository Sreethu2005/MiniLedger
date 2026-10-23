import request from 'supertest';
import app from '../src/app';
import { pool, closePool } from '../src/db';

describe('Auth API Endpoints', () => {
  const testPhone = `+1555${Date.now().toString().slice(-7)}`;

  afterAll(async () => {
    // Clean up test data
    await pool.query('DELETE FROM otps WHERE phone = $1', [testPhone]);
    await pool.query('DELETE FROM users WHERE phone = $1', [testPhone]);
    await closePool();
  });

  describe('POST /auth/request-otp', () => {
    it('should reject invalid or missing phone numbers with 400', async () => {
      const res = await request(app)
        .post('/auth/request-otp')
        .send({ phone: '123' }); // Too short

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
      expect(typeof res.body.error).toBe('string');
    });

    it('should generate a 6-digit OTP and store it with expiry', async () => {
      const res = await request(app)
        .post('/auth/request-otp')
        .send({ phone: testPhone });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('OTP sent successfully');
      expect(res.body.phone).toBe(testPhone);

      // Verify database record
      const dbRes = await pool.query(
        'SELECT * FROM otps WHERE phone = $1 AND used = false ORDER BY id DESC LIMIT 1',
        [testPhone]
      );
      expect(dbRes.rowCount).toBe(1);
      expect(dbRes.rows[0].code).toMatch(/^\d{6}$/);
      expect(new Date(dbRes.rows[0].expires_at).getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('POST /auth/verify-otp', () => {
    it('should reject invalid OTP codes with 400', async () => {
      const res = await request(app)
        .post('/auth/verify-otp')
        .send({ phone: testPhone, otp: '000000' });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/invalid|used/i);
    });

    it('should reject expired OTP codes with 400', async () => {
      // Insert an expired OTP manually
      await pool.query(
        `INSERT INTO otps (phone, code, expires_at, used)
         VALUES ($1, '888888', NOW() - INTERVAL '10 minutes', false)`,
        [testPhone]
      );

      const res = await request(app)
        .post('/auth/verify-otp')
        .send({ phone: testPhone, otp: '888888' });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/expired/i);
    });

    it('should verify valid OTP, register user, mark OTP used, and return JWT', async () => {
      // Request a fresh OTP
      await request(app)
        .post('/auth/request-otp')
        .send({ phone: testPhone });

      // Fetch latest valid OTP
      const dbRes = await pool.query(
        'SELECT code FROM otps WHERE phone = $1 AND used = false AND expires_at > NOW() ORDER BY id DESC LIMIT 1',
        [testPhone]
      );
      const code = dbRes.rows[0].code;

      const res = await request(app)
        .post('/auth/verify-otp')
        .send({ phone: testPhone, otp: code });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.phone).toBe(testPhone);
      expect(typeof res.body.token).toBe('string');

      // Verify OTP is now marked as used in DB
      const checkUsed = await pool.query(
        'SELECT used FROM otps WHERE phone = $1 AND code = $2',
        [testPhone, code]
      );
      expect(checkUsed.rows[0].used).toBe(true);

      // Verify replay attack: reusing the same OTP code fails
      const replayRes = await request(app)
        .post('/auth/verify-otp')
        .send({ phone: testPhone, otp: code });

      expect(replayRes.status).toBe(400);
      expect(replayRes.body.error).toMatch(/invalid|used/i);
    });
  });
});
