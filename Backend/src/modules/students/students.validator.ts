import { z } from 'zod';
import { STUDENT_GENDERS, STUDENT_STATUSES } from './students.types.js';

const emptyToNull = z.literal('').transform(() => null);

const optionalPhone = z
  .union([z.string().trim().min(7).max(20), emptyToNull, z.null()])
  .optional();

const optionalEmail = z
  .union([z.string().trim().email('Invalid email').toLowerCase(), emptyToNull, z.null()])
  .optional();

const optionalText = (max: number) =>
  z.union([z.string().trim().max(max), emptyToNull, z.null()]).optional();

export const createStudentSchema = z.object({
  body: z.object({
    admissionNo: z.string().trim().min(1).max(50).optional(),
    fullName: z.string().trim().min(2, 'Name too short').max(200),
    gender: z.enum(STUDENT_GENDERS),
    dateOfBirth: z.string().date('Invalid date of birth'),
    bloodGroup: optionalText(10),
    phone: optionalPhone,
    email: optionalEmail,
    address: optionalText(1000),
    classId: z.string().uuid('Invalid class'),
    sectionId: z.string().uuid('Invalid section'),
    guardianName: z.string().trim().min(2).max(200),
    guardianPhone: z.string().trim().min(7).max(20),
    guardianEmail: optionalEmail,
    guardianRelation: optionalText(50),
    status: z.enum(STUDENT_STATUSES).optional(),
    admissionDate: z.string().date('Invalid admission date').optional(),
    notes: optionalText(2000),
  }),
});

export const updateStudentSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid student ID') }),
  body: z
    .object({
      admissionNo: z.string().trim().min(1).max(50).optional(),
      fullName: z.string().trim().min(2).max(200).optional(),
      gender: z.enum(STUDENT_GENDERS).optional(),
      dateOfBirth: z.string().date().optional(),
      bloodGroup: optionalText(10),
      phone: optionalPhone,
      email: optionalEmail,
      address: optionalText(1000),
      classId: z.string().uuid().optional(),
      sectionId: z.string().uuid().optional(),
      guardianName: z.string().trim().min(2).max(200).optional(),
      guardianPhone: z.string().trim().min(7).max(20).optional(),
      guardianEmail: optionalEmail,
      guardianRelation: optionalText(50),
      status: z.enum(STUDENT_STATUSES).optional(),
      admissionDate: z.string().date().optional(),
      notes: optionalText(2000),
    })
    .refine((body) => Object.keys(body).length > 0, {
      message: 'At least one field must be provided',
    }),
});

export const listStudentsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(200).optional(),
    classId: z.string().uuid().optional(),
    sectionId: z.string().uuid().optional(),
    status: z.enum(STUDENT_STATUSES).optional(),
  }),
});

export const studentIdSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid student ID') }),
});
