import { z } from 'zod';
import {
  DATE_FORMAT_VALUES,
  isValidIanaTimeZone,
} from '../../../lib/tenant-locale.js';

export const updateSchoolSettingsSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(2).max(200).optional(),
      city: z.string().trim().max(100).nullable().optional(),
      address: z.string().trim().max(500).nullable().optional(),
      logoUrl: z.string().trim().url().max(500).nullable().optional().or(z.literal('').transform(() => null)),
      ownerName: z.string().trim().min(2).max(200).optional(),
      ownerPhone: z.string().trim().min(7).max(20).optional(),
      settings: z
        .object({
          academicYear: z.string().trim().max(50).optional(),
          gradingSystem: z.string().trim().max(50).optional(),
          timezone: z
            .string()
            .trim()
            .max(80)
            .refine(isValidIanaTimeZone, 'Invalid timezone')
            .optional(),
          dateFormat: z.enum(DATE_FORMAT_VALUES).optional(),
          currency: z.string().trim().max(10).optional(),
          cardAttendanceEnabled: z.boolean().optional(),
        })
        .optional(),
    })
    .refine((body) => Object.keys(body).length > 0, {
      message: 'At least one field must be provided',
    }),
});
