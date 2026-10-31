import { z } from 'zod';
import { ATTENDANCE_STATUSES } from './attendance.types.js';

export const getSheetSchema = z.object({
  query: z.object({
    sectionId: z.string().uuid('Invalid section'),
    date: z.string().date('Invalid date'),
  }),
});

export const saveSheetSchema = z.object({
  body: z.object({
    sectionId: z.string().uuid('Invalid section'),
    date: z.string().date('Invalid date'),
    records: z
      .array(
        z.object({
          studentId: z.string().uuid('Invalid student'),
          status: z.enum(ATTENDANCE_STATUSES),
          notes: z.string().trim().max(500).nullable().optional(),
        }),
      )
      .min(1, 'At least one attendance record is required')
      .max(300),
  }),
});

export const summarySchema = z.object({
  query: z.object({
    sectionId: z.string().uuid('Invalid section'),
    from: z.string().date('Invalid from date'),
    to: z.string().date('Invalid to date'),
  }),
});
