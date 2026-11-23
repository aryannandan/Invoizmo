import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import { env } from './config/env.js';
import { mongoSanitizeMiddleware } from './middleware/sanitize.js';
import { errorHandler } from './middleware/errorHandler.js';
import { AppError } from './utils/ownershipCheck.js';

import { authRoutes } from './modules/auth/auth.routes.js';
import { userRoutes } from './modules/users/user.routes.js';
import { invoiceRoutes } from './modules/invoices/invoice.routes.js';
import { trashRoutes } from './modules/invoices/trash.routes.js';
import { templateRoutes } from './modules/templates/template.routes.js';
import { contactRoutes } from './modules/contact/contact.routes.js';
import { verifyPrintToken } from './services/pdf/printToken.js';
import { renderInvoiceHtml } from './services/pdf/renderTemplate.js';
import { Invoice } from './modules/invoices/invoice.model.js';

const app = express();

// 1. Security HTTP Headers
app.use(helmet());

// 2. CORS — Explicit origin allowlist with credentials
const allowedOrigins = env.CORS_ORIGINS.split(',').map((o) => o.trim());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new AppError('Not allowed by CORS', 403, 'FORBIDDEN'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// 3. Body Parsing & Cookies
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// 4. NoSQL Injection Prevention
app.use(mongoSanitizeMiddleware);

// 5. Development Logging
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// 6. Health & Readiness (Must be unauthenticated and unthrottled for production hosts)
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'healthy', uptime: process.uptime() });
});

app.get('/ready', (_req, res) => {
  const isReady = mongoose.connection.readyState === 1;
  if (isReady) {
    res.status(200).json({ status: 'ready', database: 'connected' });
  } else {
    res.status(503).json({ status: 'unready', database: 'disconnected' });
  }
});

// 6.1 Internal Print Route (PRD Section 6.4 — for PDF generation or print preview)
app.get('/print/invoice/:id', async (req, res, next) => {
  try {
    const token = req.query.token as string;
    if (!token) {
      throw new AppError('Print token required', 401, 'UNAUTHORIZED');
    }

    const payload = verifyPrintToken(token);
    if (payload.invoiceId !== req.params.id) {
      throw new AppError('Print token mismatch', 403, 'FORBIDDEN');
    }

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      throw new AppError('Invoice not found', 404, 'NOT_FOUND');
    }

    const html = renderInvoiceHtml({
      invoice,
      isDraft: invoice.status === 'draft',
      isFreePlan: false, // Internal print view
      size: (req.query.size as 'A4' | 'Letter') || 'A4',
    });

    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    res.status(200).type('html').send(html);
  } catch (error) {
    next(error);
  }
});

// 7. Global API Rate Limiter
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'test',
  handler: (_req, _res, next) => {
    next(new AppError('Too many requests, please try again later.', 429, 'RATE_LIMIT_EXCEEDED'));
  },
});
app.use('/api', globalLimiter);

// 8. API v1 Routes
const apiRouter = express.Router();
apiRouter.get('/', (_req, res) => {
  res.status(200).json({ success: true, message: 'Invoizmo API v1' });
});

apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/invoices', invoiceRoutes);
apiRouter.use('/trash', trashRoutes);
apiRouter.use('/templates', templateRoutes);
apiRouter.use('/contact', contactRoutes);

app.use('/api/v1', apiRouter);

// 9. 404 Handler for Unknown Routes
app.use((_req, _res, next) => {
  next(new AppError('Resource not found', 404, 'NOT_FOUND'));
});

// 10. Central Error Handler (always last)
app.use(errorHandler);

export { app };
