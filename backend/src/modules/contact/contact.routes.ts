import express from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import { AppError } from '../../utils/ownershipCheck.js';
import mongoose, { Schema } from 'mongoose';

import { env } from '../../config/env.js';

const contactMessageSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
  },
  { timestamps: true }
);

export const ContactMessage = mongoose.model('ContactMessage', contactMessageSchema);

const router = express.Router();

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'test',
  handler: (_req, _res, next) => {
    next(new AppError('Too many contact submissions. Please wait a few minutes.', 429, 'RATE_LIMIT_EXCEEDED'));
  },
});

const contactBodySchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(2, 'Subject is required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  honeypot: z.string().optional(),
});

router.post('/', contactLimiter, validate({ body: contactBodySchema }), async (req, res, next) => {
  try {
    const { name, email, subject, message, honeypot } = req.body;
    if (honeypot) {
      // Honeypot caught spam — silently succeed without saving
      res.status(200).json({ success: true, data: { message: 'Message sent successfully' } });
      return;
    }

    await ContactMessage.create({ name, email, subject, message });

    res.status(200).json({
      success: true,
      data: { message: 'Message received. We will get back to you shortly.' },
    });
  } catch (error) {
    next(error);
  }
});

export const contactRoutes = router;
