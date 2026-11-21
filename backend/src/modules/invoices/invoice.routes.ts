import express from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../../middleware/requireAuth.js';
import { requireVerified } from '../../middleware/requireVerified.js';
import { validate } from '../../middleware/validate.js';
import { AppError } from '../../utils/ownershipCheck.js';
import {
  createInvoiceSchema,
  updateInvoiceSchema,
  listInvoicesQuerySchema,
} from './invoice.schema.js';
import {
  createInvoice,
  listInvoices,
  getInvoice,
  updateInvoice,
  markSent,
  markPaid,
  markUnpaid,
  markDraft,
  archiveInvoice,
  unarchiveInvoice,
  duplicateInvoice,
  moveToTrash,
  downloadInvoicePdf,
} from './invoice.controller.js';

const router = express.Router();

router.use(requireAuth);

// Dedicated PDF Generation Rate Limiter (20 requests per minute to prevent CPU spikes)
const pdfLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new AppError('PDF generation rate limit exceeded. Please wait a moment.', 429, 'RATE_LIMIT_EXCEEDED'));
  },
});

router.get('/', validate({ query: listInvoicesQuerySchema }), listInvoices);
router.post('/', validate({ body: createInvoiceSchema }), createInvoice);
router.get('/:id', getInvoice);
router.get('/:id/pdf', pdfLimiter, requireVerified, downloadInvoicePdf);
router.patch('/:id', validate({ body: updateInvoiceSchema }), updateInvoice);
router.post('/:id/mark-sent', requireVerified, markSent);
router.post('/:id/mark-paid', markPaid);
router.post('/:id/mark-unpaid', markUnpaid);
router.post('/:id/mark-draft', markDraft);
router.post('/:id/archive', archiveInvoice);
router.post('/:id/unarchive', unarchiveInvoice);
router.post('/:id/duplicate', duplicateInvoice);
router.delete('/:id', moveToTrash);

export const invoiceRoutes = router;
