import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  business: z
    .object({
      name: z.string().optional(),
      address: z.string().optional(),
      taxId: z.string().optional(),
      phone: z.string().optional(),
      website: z.string().optional(),
    })
    .optional(),
  defaults: z
    .object({
      currency: z.string().min(3).max(3).optional(),
      paymentTermsDays: z.number().int().min(0).max(365).optional(),
      notes: z.string().optional(),
      terms: z.string().optional(),
    })
    .optional(),
  invoicePrefix: z.string().max(10).optional(),
  startingNumber: z.number().int().min(1).optional(),
  currentPassword: z.string().optional(),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, 'Password must contain at least one letter and one number')
    .optional(),
});

export const deleteAccountSchema = z.object({
  confirmText: z.string(),
});
