import { z } from 'zod';
import { EXPENSE_PAYMENT_METHODS, EXPENSE_STATUSES } from './expenses.types.js';

const moneyAmount = z.coerce.number().int().positive().max(100_000_000);
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const createExpenseCategorySchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(120),
    description: z.string().trim().max(2000).nullable().optional(),
  }),
});

export const updateExpenseCategorySchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z
    .object({
      name: z.string().trim().min(2).max(120).optional(),
      description: z.string().trim().max(2000).nullable().optional(),
      isActive: z.boolean().optional(),
    })
    .refine((body) => Object.keys(body).length > 0, {
      message: 'At least one field must be provided',
    }),
});

export const listExpenseCategoriesSchema = z.object({
  query: z.object({
    activeOnly: z
      .enum(['true', 'false'])
      .optional()
      .transform((value) => (value === undefined ? undefined : value === 'true')),
  }),
});

export const expenseCategoryIdSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

export const createExpenseSchema = z.object({
  body: z.object({
    title: z.string().trim().min(2).max(200),
    amount: moneyAmount,
    expenseDate: dateString,
    categoryId: z.string().uuid().nullable().optional(),
    paymentMethod: z.enum(EXPENSE_PAYMENT_METHODS).optional(),
    vendor: z.string().trim().max(150).nullable().optional(),
    reference: z.string().trim().max(100).nullable().optional(),
    notes: z.string().trim().max(2000).nullable().optional(),
  }),
});

export const updateExpenseSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z
    .object({
      title: z.string().trim().min(2).max(200).optional(),
      amount: moneyAmount.optional(),
      expenseDate: dateString.optional(),
      categoryId: z.string().uuid().nullable().optional(),
      paymentMethod: z.enum(EXPENSE_PAYMENT_METHODS).optional(),
      vendor: z.string().trim().max(150).nullable().optional(),
      reference: z.string().trim().max(100).nullable().optional(),
      notes: z.string().trim().max(2000).nullable().optional(),
      status: z.enum(EXPENSE_STATUSES).optional(),
    })
    .refine((body) => Object.keys(body).length > 0, {
      message: 'At least one field must be provided',
    }),
});

export const listExpensesSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(200).optional(),
    categoryId: z.string().uuid().optional(),
    paymentMethod: z.enum(EXPENSE_PAYMENT_METHODS).optional(),
    status: z.enum(EXPENSE_STATUSES).optional(),
    fromDate: dateString.optional(),
    toDate: dateString.optional(),
  }),
});

export const expenseIdSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});
