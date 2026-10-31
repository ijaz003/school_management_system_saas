import { z } from 'zod';
import { NOTICE_AUDIENCES, NOTICE_STATUSES } from './notices.types.js';

export const createNoticeSchema = z.object({
  body: z.object({
    title: z.string().trim().min(3).max(200),
    body: z.string().trim().min(1).max(10000),
    audience: z.enum(NOTICE_AUDIENCES).optional(),
    publish: z.boolean().optional(),
  }),
});

export const updateNoticeSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z
    .object({
      title: z.string().trim().min(3).max(200).optional(),
      body: z.string().trim().min(1).max(10000).optional(),
      audience: z.enum(NOTICE_AUDIENCES).optional(),
    })
    .refine((body) => Object.keys(body).length > 0, {
      message: 'At least one field must be provided',
    }),
});

export const listNoticesSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(200).optional(),
    status: z.enum(NOTICE_STATUSES).optional(),
    audience: z.enum(NOTICE_AUDIENCES).optional(),
  }),
});

export const noticeIdSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});
