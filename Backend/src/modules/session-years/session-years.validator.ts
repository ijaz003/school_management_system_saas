import { z } from 'zod';
import { SESSION_YEAR_STATUSES } from './session-years.types.js';

const dateString = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD');

export const createSessionYearSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(4).max(50),
      startDate: dateString,
      endDate: dateString,
      status: z.enum(SESSION_YEAR_STATUSES).optional(),
      setAsCurrent: z.boolean().optional(),
    })
    .refine((body) => body.endDate >= body.startDate, {
      message: 'End date must be on or after start date',
      path: ['endDate'],
    }),
});

export const updateSessionYearSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z
    .object({
      name: z.string().trim().min(4).max(50).optional(),
      startDate: dateString.optional(),
      endDate: dateString.optional(),
      status: z.enum(SESSION_YEAR_STATUSES).optional(),
    })
    .refine((body) => Object.keys(body).length > 0, {
      message: 'At least one field must be provided',
    }),
});

export const sessionYearIdSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

export const promoteStudentsSchema = z.object({
  body: z.object({
    fromSessionYearId: z.string().uuid(),
    toSessionYearId: z.string().uuid(),
    fromClassId: z.string().uuid(),
    toClassId: z.string().uuid().optional(),
    sectionMap: z.record(z.string().uuid(), z.string().uuid()).optional(),
    studentIds: z.array(z.string().uuid()).max(1000).optional(),
    retainStudentIds: z.array(z.string().uuid()).max(1000).optional(),
    graduateStudentIds: z.array(z.string().uuid()).max(1000).optional(),
  }),
});

export const listPlacementsSchema = z.object({
  query: z.object({
    sessionYearId: z.string().uuid().optional(),
    classId: z.string().uuid().optional(),
    studentId: z.string().uuid().optional(),
  }),
});
