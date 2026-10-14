import { z } from 'zod';

export const createSectionSchema = z.object({
  body: z.object({
    classId: z.string().uuid(),
    name: z.string().trim().min(1).max(20),
    useClassSubjects: z.boolean().default(true),
    stream: z.string().trim().max(50).optional(),
    capacity: z.number().int().min(1).max(200).optional(),
    classTeacherId: z.string().uuid().nullable().optional(),
    subjectIds: z.array(z.string().uuid()).max(100).optional(),
  }).refine((body) => body.useClassSubjects || (body.subjectIds?.length ?? 0) > 0, {
    message: 'Select at least one subject for a custom subject list',
    path: ['subjectIds'],
  }),
});

export const updateSectionSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    name: z.string().trim().min(1).max(20).optional(),
    stream: z.string().trim().max(50).nullable().optional(),
    capacity: z.number().int().min(1).max(200).optional(),
    classTeacherId: z.string().uuid().nullable().optional(),
    useClassSubjects: z.boolean().optional(),
    subjectIds: z.array(z.string().uuid()).max(100).optional(),
  }).refine((body) => Object.keys(body).length > 0, {
    message: 'At least one field must be provided',
  }),
});

export const sectionIdSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

export const listSectionsSchema = z.object({
  params: z.object({ classId: z.string().uuid() }),
});

export const setSectionSubjectsSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    subjectIds: z.array(z.string().uuid()).max(100),
  }),
});
