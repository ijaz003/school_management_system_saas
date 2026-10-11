import { z } from 'zod';

const planSchema = z.enum(['basic', 'standard', 'premium']);
const statusSchema = z.enum(['trial', 'active', 'suspended', 'cancelled']);
const slugSchema = z
  .string()
  .trim()
  .min(2)
  .max(100)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Slug can only contain lowercase letters, numbers, and single hyphens',
  );

export const createTenantSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(200),
    slug: slugSchema,
    ownerName: z.string().trim().min(2).max(200),
    ownerEmail: z.string().trim().email().toLowerCase(),
    ownerPhone: z.string().trim().min(10).max(20),
    city: z.string().trim().max(100).optional(),
    address: z.string().trim().max(500).optional(),
    plan: planSchema.optional(),
    customPermissions: z.array(z.string().trim().min(1)).optional(),
  }),
});

export const updateTenantSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid tenant ID'),
  }),
  body: z
    .object({
      name: z.string().trim().min(2).max(200).optional(),
      city: z.string().trim().max(100).nullable().optional(),
      address: z.string().trim().max(500).nullable().optional(),
      logoUrl: z.string().url().nullable().optional(),
      plan: planSchema.optional(),
      status: statusSchema.optional(),
    })
    .refine((body) => Object.keys(body).length > 0, {
      message: 'At least one field must be provided',
    }),
});

export const updateTenantPermissionsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid tenant ID'),
  }),
  body: z.object({
    permissions: z.array(z.string().trim().min(1)).min(1),
  }),
});

export const listTenantsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(200).optional(),
    status: statusSchema.optional(),
    plan: planSchema.optional(),
  }),
});

export const tenantIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid tenant ID'),
  }),
});
