import { Request, Response } from 'express';
import { query } from '../db';
import { generateOtpCode } from '../utils/otp';
import { signJwt } from '../utils/jwt';

/**
 * POST /auth/request-otp
 * Body: { phone: string }
 * Generates a 6-digit OTP, stores it with 5-min expiry, logs mock SMS.
 */
export const requestOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone } = req.body;

    if (!phone || typeof phone !== 'string' || phone.trim().length === 0) {
      res.status(400).json({ error: 'Valid phone number is required' });
      return;
    }

    const cleanedPhone = phone.trim();
    const otpCode = generateOtpCode();
    // 5 minutes expiry from current timestamp
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Save OTP to database
    await query(
      `INSERT INTO otps (phone, code, expires_at, used)
       VALUES ($1, $2, $3, false)`,
      [cleanedPhone, otpCode, expiresAt]
    );

    // Mock SMS output clearly visible in console
    console.log(`\n======================================================`);
    console.log(`📱 [MOCK SMS] OTP for Phone: ${cleanedPhone}`);
    console.log(`🔑 Verification Code: ${otpCode}`);
    console.log(`⏳ Valid until: ${expiresAt.toLocaleTimeString()} (5 minutes)`);
    console.log(`======================================================\n`);

    res.status(200).json({
      message: 'OTP sent successfully',
      phone: cleanedPhone,
    });
  } catch (error: any) {
    console.error('Error in requestOtp:', error);
    res.status(500).json({ error: 'Failed to generate OTP. Please try again.' });
  }
};

/**
 * POST /auth/verify-otp
 * Body: { phone: string, otp: string }
 * Validates OTP code, marks it used, creates user if new, and returns JWT.
 */
export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, otp } = req.body;

    if (!phone || typeof phone !== 'string' || !otp || typeof otp !== 'string') {
      res.status(400).json({ error: 'Phone and OTP code are required' });
      return;
    }

    const cleanedPhone = phone.trim();
    const cleanedOtp = otp.trim();

    // Query for matching unused OTP
    const otpResult = await query(
      `SELECT * FROM otps
       WHERE phone = $1 AND code = $2 AND used = false
       ORDER BY id DESC
       LIMIT 1`,
      [cleanedPhone, cleanedOtp]
    );

    if (otpResult.rowCount === 0) {
      res.status(400).json({ error: 'Invalid or already used OTP' });
      return;
    }

    const otpRecord = otpResult.rows[0];

    // Check expiry
    const now = new Date();
    if (new Date(otpRecord.expires_at) < now) {
      res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
      return;
    }

    // Mark OTP as used to prevent replay attacks
    await query(`UPDATE otps SET used = true WHERE id = $1`, [otpRecord.id]);

    // Check if user already exists or create new user
    let userResult = await query(
      `SELECT * FROM users WHERE phone = $1`,
      [cleanedPhone]
    );

    let user;
    if (userResult.rowCount === 0) {
      // Create new user record
      const newUserResult = await query(
        `INSERT INTO users (phone)
         VALUES ($1)
         RETURNING id, phone, created_at`,
        [cleanedPhone]
      );
      user = newUserResult.rows[0];
      console.log(`👤 New user registered: ${user.phone} (ID: ${user.id})`);
    } else {
      user = userResult.rows[0];
    }

    // Generate JWT token
    const token = signJwt({
      userId: user.id,
      phone: user.phone,
    });

    res.status(200).json({
      token,
      user: {
        id: user.id,
        phone: user.phone,
        createdAt: user.created_at,
      },
    });
  } catch (error: any) {
    console.error('Error in verifyOtp:', error);
    res.status(500).json({ error: 'Failed to verify OTP. Please try again.' });
  }
};
