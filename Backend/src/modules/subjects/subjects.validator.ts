import { z } from 'zod';

const subjectFields = {
  name: z.string().trim().min(2).max(100),
  code: z.string().trim().min(2).max(20).regex(/^[A-Za-z0-9]+$/),
  description: z.string().trim().max(500).nullable().optional(),
  isElective: z.boolean().optional(),
};

export const createSubjectSchema = z.object({
  body: z.object(subjectFields),
});

export const updateSubjectSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    name: subjectFields.name.optional(),
    code: subjectFields.code.optional(),
    description: subjectFields.description,
    isElective: subjectFields.isElective,
  }).refine((body) => Object.keys(body).length > 0, {
    message: 'At least one field must be provided',
  }),
});

export const subjectIdSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

export const listSubjectsSchema = z.object({
  query: z.object({ search: z.string().trim().max(100).optional() }),
});
