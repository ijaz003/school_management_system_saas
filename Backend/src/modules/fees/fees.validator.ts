import { z } from 'zod';
import {
  FEE_FREQUENCIES,
  INVOICE_STATUSES,
  PAYMENT_METHODS,
} from './fees.types.js';

const moneyAmount = z.coerce.number().int().positive().max(100_000_000);

export const createFeeStructureSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(150),
    classId: z.string().uuid().nullable().optional(),
    sectionId: z.string().uuid().nullable().optional(),
    amount: moneyAmount,
    frequency: z.enum(FEE_FREQUENCIES).optional(),
    description: z.string().trim().max(2000).nullable().optional(),
  }),
});

export const updateFeeStructureSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z
    .object({
      name: z.string().trim().min(2).max(150).optional(),
      classId: z.string().uuid().nullable().optional(),
      sectionId: z.string().uuid().nullable().optional(),
      amount: moneyAmount.optional(),
      frequency: z.enum(FEE_FREQUENCIES).optional(),
      description: z.string().trim().max(2000).nullable().optional(),
      isActive: z.boolean().optional(),
    })
    .refine((body) => Object.keys(body).length > 0, {
      message: 'At least one field must be provided',
    }),
});

export const listFeeStructuresSchema = z.object({
  query: z.object({
    classId: z.string().uuid().optional(),
    activeOnly: z
      .enum(['true', 'false'])
      .optional()
      .transform((value) => (value === undefined ? undefined : value === 'true')),
  }),
});

export const structureIdSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

export const createInvoiceSchema = z.object({
  body: z.object({
    studentId: z.string().uuid(),
    feeStructureId: z.string().uuid().optional(),
    title: z.string().trim().min(2).max(200).optional(),
    periodLabel: z.string().trim().max(100).optional(),
    amount: moneyAmount.optional(),
    dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    notes: z.string().trim().max(2000).optional(),
    issue: z.boolean().optional(),
  }),
});

export const generateInvoicesSchema = z.object({
  body: z.object({
    feeStructureId: z.string().uuid(),
    periodLabel: z.string().trim().min(1).max(100),
    dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    classId: z.string().uuid().optional(),
    sectionId: z.string().uuid().optional(),
    notes: z.string().trim().max(2000).optional(),
  }),
});

export const listInvoicesSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(200).optional(),
    status: z.enum(INVOICE_STATUSES).optional(),
    studentId: z.string().uuid().optional(),
    classId: z.string().uuid().optional(),
    sectionId: z.string().uuid().optional(),
  }),
});

export const invoiceIdSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

export const recordPaymentSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    amount: moneyAmount,
    method: z.enum(PAYMENT_METHODS).optional(),
    paidAt: z.string().datetime().optional(),
    reference: z.string().trim().max(100).optional(),
    notes: z.string().trim().max(2000).optional(),
  }),
});

export const paymentIdSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});
