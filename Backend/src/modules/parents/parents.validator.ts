import { z } from 'zod';

export const createParentSchema = z.object({
  body: z.object({
    fullName: z.string().trim().min(2).max(200),
    email: z.string().trim().email().max(255),
    phone: z.string().trim().min(7).max(20).optional(),
    studentIds: z.array(z.string().uuid()).max(20).optional(),
  }),
});

export const updateParentSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z
    .object({
      fullName: z.string().trim().min(2).max(200).optional(),
      phone: z.string().trim().min(7).max(20).nullable().optional(),
      isActive: z.boolean().optional(),
    })
    .refine((body) => Object.keys(body).length > 0, {
      message: 'At least one field must be provided',
    }),
});

export const listParentsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(200).optional(),
    isActive: z
      .enum(['true', 'false'])
      .optional()
      .transform((value) => (value === undefined ? undefined : value === 'true')),
  }),
});

export const parentIdSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

export const linkStudentsSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    studentIds: z.array(z.string().uuid()).min(1).max(20),
  }),
});

export const unlinkStudentSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
    studentId: z.string().uuid(),
  }),
});
