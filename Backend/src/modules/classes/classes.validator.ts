import { z } from 'zod';

const classFields = {
  name: z.string().trim().min(1).max(50),
  order: z.number().int().min(1).max(20),
  type: z.enum(['common', 'streamed']),
  description: z.string().trim().max(500).nullable(),
};

export const createClassSchema = z.object({
  body: z.object({
    name: classFields.name,
    order: classFields.order,
    type: classFields.type.optional(),
    description: classFields.description.optional(),
  }),
});

export const updateClassSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    name: classFields.name.optional(),
    order: classFields.order.optional(),
    type: classFields.type.optional(),
    description: classFields.description.optional(),
  }).refine((body) => Object.keys(body).length > 0, {
    message: 'At least one field must be provided',
  }),
});

export const classIdSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

export const addSubjectsToClassSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    subjectIds: z.array(z.string().uuid()).min(1).max(100),
  }),
});

export const classSubjectParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
    subjectId: z.string().uuid(),
  }),
});

export const listClassesSchema = z.object({
  query: z.object({ search: z.string().trim().max(100).optional() }),
});
