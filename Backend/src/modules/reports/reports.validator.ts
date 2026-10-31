import { z } from 'zod';

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const feesReportSchema = z.object({
  query: z
    .object({
      from: dateString.optional(),
      to: dateString.optional(),
      classId: z.string().uuid().optional(),
      status: z.enum(['draft', 'issued', 'partial', 'paid', 'cancelled']).optional(),
    })
    .refine(
      (query) =>
        !query.from || !query.to || query.from <= query.to,
      { message: '"from" must be on or before "to"', path: ['to'] },
    ),
});

export const attendanceReportSchema = z.object({
  query: z
    .object({
      from: dateString,
      to: dateString,
      classId: z.string().uuid().optional(),
      sectionId: z.string().uuid().optional(),
    })
    .refine((query) => query.from <= query.to, {
      message: '"from" must be on or before "to"',
      path: ['to'],
    }),
});

export const academicReportSchema = z.object({
  query: z.object({
    examId: z.string().uuid().optional(),
    classId: z.string().uuid().optional(),
  }),
});
