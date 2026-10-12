import { z } from 'zod';

export const createStaffSchema = z.object({
  body: z.object({
    fullName: z.string().trim().min(2, 'Name too short').max(200),
    email: z.string().trim().email('Invalid email').toLowerCase(),
    phone: z.string().trim().min(10, 'Phone too short').max(20, 'Phone too long'),
    roleId: z.string().uuid('Invalid role'),
    subject: z.string().trim().max(100).optional(),
    joiningDate: z.string().date().optional(),
    sendEmail: z.boolean().optional(),
  }),
});

export const updateStaffSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid staff ID') }),
  body: z
    .object({
      fullName: z.string().trim().min(2).max(200).optional(),
      phone: z.string().trim().min(10).max(20).optional(),
      roleId: z.string().uuid().optional(),
      subject: z.string().trim().max(100).nullable().optional(),
      isActive: z.boolean().optional(),
    })
    .refine((body) => Object.keys(body).length > 0, {
      message: 'At least one field must be provided',
    }),
});

export const listStaffSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(200).optional(),
    role: z.string().trim().min(1).max(50).optional(),
    isActive: z.enum(['true', 'false']).optional(),
  }),
});

export const staffIdSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid staff ID') }),
});
