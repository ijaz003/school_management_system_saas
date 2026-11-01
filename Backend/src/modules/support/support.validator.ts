import { z } from 'zod';
import {
  SUPPORT_CATEGORIES,
  SUPPORT_PRIORITIES,
  SUPPORT_STATUSES,
} from './support.types.js';

export const createSupportTicketSchema = z.object({
  body: z.object({
    subject: z.string().trim().min(3).max(200),
    body: z.string().trim().min(1).max(10000),
    category: z.enum(SUPPORT_CATEGORIES).optional(),
    priority: z.enum(SUPPORT_PRIORITIES).optional(),
  }),
});

export const updateSupportTicketSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z
    .object({
      status: z.enum(SUPPORT_STATUSES).optional(),
      priority: z.enum(SUPPORT_PRIORITIES).optional(),
      category: z.enum(SUPPORT_CATEGORIES).optional(),
      assignedTo: z.string().uuid().nullable().optional(),
    })
    .refine((body) => Object.keys(body).length > 0, {
      message: 'At least one field must be provided',
    }),
});

export const createSupportMessageSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    body: z.string().trim().min(1).max(10000),
    isInternal: z.boolean().optional(),
  }),
});

export const listSupportTicketsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(200).optional(),
    status: z.enum(SUPPORT_STATUSES).optional(),
    category: z.enum(SUPPORT_CATEGORIES).optional(),
    priority: z.enum(SUPPORT_PRIORITIES).optional(),
    tenantId: z.string().uuid().optional(),
  }),
});

export const supportTicketIdSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});
