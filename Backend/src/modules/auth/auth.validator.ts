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

export const updateProfileSchema = z.object({
  body: z
    .object({
      fullName: z.string().trim().min(2).max(200).optional(),
      phone: z.string().trim().min(7).max(20).nullable().optional(),
    })
    .refine((body) => Object.keys(body).length > 0, {
      message: 'At least one field must be provided',
    }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(6),
    newPassword: z.string().min(6).max(100),
  }),
});
