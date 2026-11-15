import { z } from 'zod';
import {
  FEE_HEAD_TYPES,
  FEE_FREQUENCIES,
  INVOICE_STATUSES,
  PAYMENT_METHODS,
  SCHEDULE_TYPES,
} from './fees.types.js';

const moneyAmount = z.coerce.number().int().positive().max(100_000_000);
const MAX_STRUCTURE_AMOUNT = 2_147_483_647;
const feeHeadCode = z
  .string()
  .trim()
  .min(2)
  .max(30)
  .toUpperCase()
  .regex(/^[A-Z0-9_]+$/, 'Code must contain uppercase letters, numbers, or underscores');

export const createFeeHeadSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(150),
    code: feeHeadCode,
    type: z.enum(FEE_HEAD_TYPES).optional(),
    description: z.string().trim().max(500).optional(),
    isMandatory: z.boolean().optional(),
  }),
});

export const updateFeeHeadSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z
    .object({
      name: z.string().trim().min(2).max(150).optional(),
      code: feeHeadCode.optional(),
      type: z.enum(FEE_HEAD_TYPES).optional(),
      description: z.string().trim().max(500).nullable().optional(),
      isMandatory: z.boolean().optional(),
      isActive: z.boolean().optional(),
    })
    .refine((body) => Object.keys(body).length > 0, {
      message: 'At least one field must be provided',
    }),
});

export const listFeeHeadsSchema = z.object({
  query: z.object({
    search: z.string().trim().max(200).optional(),
    activeOnly: z
      .enum(['true', 'false'])
      .optional()
      .transform((value) => (value === undefined ? undefined : value === 'true')),
  }),
});

export const feeHeadIdSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

const feeStructureItemSchema = z
  .object({
    feeHeadId: z.string().uuid(),
    amount: moneyAmount,
    scheduleType: z.enum(SCHEDULE_TYPES).default('monthly'),
    months: z.array(z.number().int().min(1).max(12)).max(12).optional(),
    academicYear: z.string().trim().min(1).max(50).optional(),
  })
  .refine(
    (item) => item.scheduleType === 'monthly' || (item.months?.length ?? 0) > 0,
    {
      message: 'Select one or more months for this schedule',
      path: ['months'],
    },
  )
  .refine(
    (item) => item.scheduleType !== 'one_time' || item.months?.length === 1,
    {
      message: 'A one-time schedule requires exactly one month',
      path: ['months'],
    },
  )
  .refine(
    (item) => !item.months || new Set(item.months).size === item.months.length,
    {
      message: 'Duplicate months are not allowed',
      path: ['months'],
    },
  );

const feeStructureItemsSchema = z
  .array(feeStructureItemSchema)
  .min(1, 'At least one fee head is required')
  .max(100, 'A fee structure can contain at most 100 fee heads')
  .refine(
    (items) => new Set(items.map((item) => item.feeHeadId)).size === items.length,
    { message: 'Duplicate fee heads are not allowed' },
  )
  .refine(
    (items) => items.reduce((total, item) => total + item.amount, 0) <= MAX_STRUCTURE_AMOUNT,
    { message: 'The total fee amount is too large' },
  );

export const createFeeStructureSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(150),
    classId: z.string().uuid().nullable().optional(),
    sectionId: z.string().uuid().nullable().optional(),
    frequency: z.enum(FEE_FREQUENCIES).optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    items: feeStructureItemsSchema,
  }),
});

export const updateFeeStructureSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z
    .object({
      name: z.string().trim().min(2).max(150).optional(),
      classId: z.string().uuid().nullable().optional(),
      sectionId: z.string().uuid().nullable().optional(),
      frequency: z.enum(FEE_FREQUENCIES).optional(),
      description: z.string().trim().max(2000).nullable().optional(),
      isActive: z.boolean().optional(),
      items: feeStructureItemsSchema.optional(),
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

export const previewInvoiceSchema = z.object({
  query: z.object({
    structureId: z.string().uuid(),
    periodLabel: z.string().trim().min(1).max(100),
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
