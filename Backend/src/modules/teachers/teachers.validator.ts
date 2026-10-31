import { z } from 'zod';

export const listTeachersSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(200).optional(),
    isActive: z.enum(['true', 'false']).optional(),
  }),
});

export const teacherIdSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid teacher ID') }),
});

export const createAssignmentSchema = z.object({
  body: z.object({
    teacherId: z.string().uuid('Invalid teacher'),
    sectionId: z.string().uuid('Invalid section'),
    subjectId: z.string().uuid('Invalid subject'),
  }),
});

export const assignmentIdSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid assignment ID') }),
});

export const setClassTeacherSchema = z.object({
  params: z.object({ sectionId: z.string().uuid('Invalid section ID') }),
  body: z.object({
    teacherId: z.string().uuid('Invalid teacher').nullable(),
  }),
});

export const listAssignmentsSchema = z.object({
  query: z.object({
    teacherId: z.string().uuid().optional(),
    sectionId: z.string().uuid().optional(),
    classId: z.string().uuid().optional(),
  }),
});
