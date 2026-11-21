import express from 'express';
import rateLimit from 'express-rate-limit';
import { validate } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { AppError } from '../../utils/ownershipCheck.js';
import {
  signupSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './auth.schema.js';
import {
  signup,
  login,
  verifyEmail,
  resendVerification,
  refresh,
  logout,
  logoutAll,
  forgotPassword,
  resetPassword,
} from './auth.controller.js';

const router = express.Router();

// Strict Rate Limiting on Auth Endpoints (10 attempts per minute)
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new AppError('Too many attempts, please try again after 1 minute.', 429, 'RATE_LIMIT_EXCEEDED'));
  },
});

router.post('/signup', authLimiter, validate({ body: signupSchema }), signup);
router.post('/login', authLimiter, validate({ body: loginSchema }), login);
router.post('/verify-email', validate({ body: verifyEmailSchema }), verifyEmail);
router.get('/verify-email', verifyEmail); // Support direct link clicks from browser
router.post('/resend-verification', authLimiter, validate({ body: resendVerificationSchema }), resendVerification);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.post('/logout-all', requireAuth, logoutAll);
router.post('/forgot-password', authLimiter, validate({ body: forgotPasswordSchema }), forgotPassword);
router.post('/reset-password', authLimiter, validate({ body: resetPasswordSchema }), resetPassword);

export const authRoutes = router;
