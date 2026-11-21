import { z } from 'zod';

export const createInvoiceSchema = z.object({
  templateId: z.string().optional().default('classic'),
  currency: z.string().length(3).optional(),
  duplicateFrom: z.string().optional(),
});

export const lineItemSchema = z.object({
  description: z.string().default(''),
  quantity: z.number().min(0).default(1),
  unit: z.string().optional().default('hrs'),
  unitPriceMinor: z.number().int().min(0).default(0),
});

export const updateInvoiceSchema = z.object({
  templateId: z.string().optional(),
  font: z.string().optional(),
  colorScheme: z.string().optional(),
  currency: z.string().length(3).optional(),
  seller: z
    .object({
      businessName: z.string().optional(),
      address: z.string().optional(),
      taxId: z.string().optional(),
      email: z.string().email().optional().or(z.literal('')),
      phone: z.string().optional(),
    })
    .optional(),
  client: z
    .object({
      name: z.string().optional(),
      company: z.string().optional(),
      email: z.string().email().optional().or(z.literal('')),
      address: z.string().optional(),
      taxId: z.string().optional(),
    })
    .optional(),
  items: z.array(lineItemSchema).optional(),
  discount: z
    .object({
      type: z.enum(['percent', 'fixed']),
      value: z.number().min(0),
    })
    .optional(),
  taxName: z.string().optional(),
  taxPercent: z.number().min(0).max(100).optional(),
  issueDate: z.string().datetime().or(z.date()).optional(),
  dueDate: z.string().datetime().or(z.date()).optional(),
  notes: z.string().optional(),
  terms: z.string().optional(),
  paymentDetails: z.string().optional(),
  logoUrl: z.string().url().optional().or(z.literal('')),
  signature: z
    .object({
      type: z.enum(['typed', 'drawn']),
      value: z.string(),
      name: z.string().optional(),
    })
    .optional(),
});

export const listInvoicesQuerySchema = z.object({
  status: z.enum(['all', 'draft', 'sent', 'paid', 'overdue', 'archived']).optional().default('all'),
  search: z.string().optional(),
  page: z.string().default('1').transform(Number),
  limit: z.string().default('20').transform(Number),
  sortBy: z.enum(['createdAt', 'issueDate', 'dueDate', 'totalMinor']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});
