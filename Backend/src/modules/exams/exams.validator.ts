import { z } from 'zod';
import { EXAM_STATUSES } from './exams.types.js';

const marksInt = z.coerce.number().int().min(0).max(10000);

export const examSubjectBodySchema = z
  .object({
    subjectId: z.string().uuid(),
    maxMarks: marksInt.refine((value) => value > 0, { message: 'maxMarks must be > 0' }),
    passMarks: marksInt,
    examDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .nullable()
      .optional(),
  })
  .refine((body) => body.passMarks <= body.maxMarks, {
    message: 'passMarks cannot exceed maxMarks',
    path: ['passMarks'],
  });

export const createExamSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(2).max(150),
      classId: z.string().uuid(),
      term: z.string().trim().max(50).optional(),
      academicYear: z.string().trim().max(20).optional(),
      startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      status: z.enum(['draft', 'scheduled']).optional(),
      subjects: z.array(examSubjectBodySchema).max(40).optional(),
    })
    .refine((body) => body.endDate >= body.startDate, {
      message: 'endDate must be on or after startDate',
      path: ['endDate'],
    }),
});

export const updateExamSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z
    .object({
      name: z.string().trim().min(2).max(150).optional(),
      term: z.string().trim().max(50).nullable().optional(),
      academicYear: z.string().trim().max(20).nullable().optional(),
      startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      status: z.enum(['draft', 'scheduled', 'marks_entry']).optional(),
    })
    .refine((body) => Object.keys(body).length > 0, {
      message: 'At least one field must be provided',
    }),
});

export const listExamsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(200).optional(),
    classId: z.string().uuid().optional(),
    status: z.enum(EXAM_STATUSES).optional(),
  }),
});

export const examIdSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

export const setExamSubjectsSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    subjects: z.array(examSubjectBodySchema).min(1).max(40),
  }),
});

export const marksSheetSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  query: z.object({
    examSubjectId: z.string().uuid(),
    sectionId: z.string().uuid(),
  }),
});

export const saveMarksSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    examSubjectId: z.string().uuid(),
    sectionId: z.string().uuid(),
    records: z
      .array(
        z.object({
          studentId: z.string().uuid(),
          marksObtained: z.coerce.number().int().min(0).max(10000).nullable().optional(),
          isAbsent: z.boolean().optional(),
          remarks: z.string().trim().max(500).nullable().optional(),
        }),
      )
      .min(1)
      .max(500),
  }),
});
