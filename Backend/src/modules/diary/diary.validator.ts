import { z } from 'zod';
import { DIARY_STATUSES } from './diary.types.js';

const dateString = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD');

export const createDiarySchema = z.object({
  body: z.object({
    entryDate: dateString,
    classId: z.string().uuid(),
    sectionId: z.string().uuid().nullable().optional(),
    title: z.string().trim().min(3).max(200),
    homework: z.string().trim().min(1).max(10000),
    classwork: z.string().trim().max(10000).nullable().optional(),
    remarks: z.string().trim().max(5000).nullable().optional(),
    publish: z.boolean().optional(),
  }),
});

export const updateDiarySchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z
    .object({
      entryDate: dateString.optional(),
      classId: z.string().uuid().optional(),
      sectionId: z.string().uuid().nullable().optional(),
      title: z.string().trim().min(3).max(200).optional(),
      homework: z.string().trim().min(1).max(10000).optional(),
      classwork: z.string().trim().max(10000).nullable().optional(),
      remarks: z.string().trim().max(5000).nullable().optional(),
    })
    .refine((body) => Object.keys(body).length > 0, {
      message: 'At least one field must be provided',
    }),
});

export const listDiarySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(200).optional(),
    status: z.enum(DIARY_STATUSES).optional(),
    classId: z.string().uuid().optional(),
    sectionId: z.string().uuid().optional(),
    entryDate: dateString.optional(),
    fromDate: dateString.optional(),
    toDate: dateString.optional(),
  }),
});

export const diaryIdSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});
