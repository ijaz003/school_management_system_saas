import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email('Invalid email address').toLowerCase(),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    tenantSlug: z.string().trim().min(1).toLowerCase().optional(),
  }),
});

export type LoginSchema = z.infer<typeof loginSchema>;

export const refreshSchema = z.object({
  body: z
    .object({
      refreshToken: z.string().min(1).optional(),
    })
    .optional(),
});

export const logoutSchema = z.object({
  body: z.object({}).optional(),
});
