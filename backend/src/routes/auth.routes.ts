import { Router } from 'express';
import { requestOtp, verifyOtp } from '../controllers/auth.controller';
import { validateBody } from '../middleware/validate.middleware';
import { requestOtpSchema, verifyOtpSchema } from '../utils/validators';

const router = Router();

// Route: Request a 6-digit OTP sent via mock SMS
router.post('/request-otp', validateBody(requestOtpSchema), requestOtp);

// Route: Verify OTP code and receive JWT authentication token
router.post('/verify-otp', validateBody(verifyOtpSchema), verifyOtp);

export default router;
