import { z } from 'zod';

export const exportStudentsSchema = z.object({
  query: z.object({
    search: z.string().trim().max(100).optional(),
    classId: z.string().uuid().optional(),
    sectionId: z.string().uuid().optional(),
    status: z.string().trim().max(30).optional(),
  }),
});

export const exportInvoicesSchema = z.object({
  query: z.object({
    search: z.string().trim().max(100).optional(),
    status: z.string().trim().max(30).optional(),
    classId: z.string().uuid().optional(),
  }),
});

export const exportExamMarksSchema = z.object({
  params: z.object({
    examId: z.string().uuid(),
  }),
});
