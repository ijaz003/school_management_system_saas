import { z } from 'zod';
import { TIMETABLE_DAYS } from './timetable.types.js';

const timeString = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be HH:MM');

export const createTimetablePeriodSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(80),
    sortOrder: z.coerce.number().int().min(0).max(100).optional(),
    startTime: timeString,
    endTime: timeString,
    isBreak: z.boolean().optional(),
  }),
});

export const updateTimetablePeriodSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z
    .object({
      name: z.string().trim().min(1).max(80).optional(),
      sortOrder: z.coerce.number().int().min(0).max(100).optional(),
      startTime: timeString.optional(),
      endTime: timeString.optional(),
      isBreak: z.boolean().optional(),
    })
    .refine((body) => Object.keys(body).length > 0, {
      message: 'At least one field must be provided',
    }),
});

export const timetablePeriodIdSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

export const listTimetableSchema = z.object({
  query: z.object({
    sectionId: z.string().uuid(),
  }),
});

export const upsertTimetableEntrySchema = z.object({
  body: z.object({
    sectionId: z.string().uuid(),
    periodId: z.string().uuid(),
    dayOfWeek: z.coerce
      .number()
      .int()
      .refine((value): value is (typeof TIMETABLE_DAYS)[number] =>
        (TIMETABLE_DAYS as readonly number[]).includes(value),
      ),
    subjectId: z.string().uuid().nullable().optional(),
    teacherId: z.string().uuid().nullable().optional(),
    room: z.string().trim().max(80).nullable().optional(),
  }),
});

export const updateTimetableEntrySchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z
    .object({
      subjectId: z.string().uuid().nullable().optional(),
      teacherId: z.string().uuid().nullable().optional(),
      room: z.string().trim().max(80).nullable().optional(),
    })
    .refine((body) => Object.keys(body).length > 0, {
      message: 'At least one field must be provided',
    }),
});

export const timetableEntryIdSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});
