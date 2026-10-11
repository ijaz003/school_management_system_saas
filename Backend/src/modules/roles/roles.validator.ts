import { z } from 'zod';

const permissionName = z
  .string()
  .trim()
  .min(3)
  .max(100)
  .regex(/^(?:[a-z][a-z0-9_-]*\.)+[a-z0-9_*_-]+$/);

export const createRoleSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(2)
      .max(50)
      .regex(/^[a-z_]+$/, 'Name must contain only lowercase letters and underscores'),
    displayName: z.string().trim().min(2).max(100),
    description: z.string().trim().max(500).optional(),
    permissions: z.array(permissionName).min(1).max(200),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    icon: z.string().trim().max(50).optional(),
  }),
});

export const updateRoleSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid role ID'),
  }),
  body: z
    .object({
      displayName: z.string().trim().min(2).max(100).optional(),
      description: z.string().trim().max(500).nullable().optional(),
      permissions: z.array(permissionName).min(1).max(200).optional(),
      color: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional(),
      icon: z.string().trim().max(50).nullable().optional(),
    })
    .refine((body) => Object.keys(body).length > 0, {
      message: 'At least one field must be provided',
    }),
});

export const assignRoleSchema = z.object({
  params: z.object({
    userId: z.string().uuid('Invalid user ID'),
  }),
  body: z.object({
    roleId: z.string().uuid('Invalid role ID'),
  }),
});

export const roleIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid role ID'),
  }),
});

export const listRolesSchema = z.object({
  query: z.object({}).optional(),
});
