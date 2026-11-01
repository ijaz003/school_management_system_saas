import { sql } from 'drizzle-orm';
import {
  date,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { tenants } from '../tenants/tenants.schema.js';
import { classes } from '../classes/classes.schema.js';
import { sections } from '../sections/sections.schema.js';

export const students = pgTable(
  'students',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    admissionNo: varchar('admission_no', { length: 50 }).notNull(),
    /** Unique scan code for QR/barcode card attendance (defaults to admission no). */
    cardCode: varchar('card_code', { length: 64 }),
    fullName: varchar('full_name', { length: 200 }).notNull(),
    gender: varchar('gender', { length: 20 }).notNull(),
    dateOfBirth: date('date_of_birth').notNull(),
    bloodGroup: varchar('blood_group', { length: 10 }),
    phone: varchar('phone', { length: 20 }),
    email: varchar('email', { length: 255 }),
    address: text('address'),
    classId: uuid('class_id')
      .notNull()
      .references(() => classes.id, { onDelete: 'restrict' }),
    sectionId: uuid('section_id')
      .notNull()
      .references(() => sections.id, { onDelete: 'restrict' }),
    guardianName: varchar('guardian_name', { length: 200 }).notNull(),
    guardianPhone: varchar('guardian_phone', { length: 20 }).notNull(),
    guardianEmail: varchar('guardian_email', { length: 255 }),
    guardianRelation: varchar('guardian_relation', { length: 50 }),
    status: varchar('status', { length: 20 }).default('active').notNull(),
    admissionDate: date('admission_date').notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    tenantIdx: index('students_tenant_idx').on(table.tenantId),
    classIdx: index('students_class_idx').on(table.classId),
    sectionIdx: index('students_section_idx').on(table.sectionId),
    statusIdx: index('students_status_idx').on(table.tenantId, table.status),
    admissionNoIdx: uniqueIndex('students_tenant_admission_no_idx')
      .on(table.tenantId, table.admissionNo)
      .where(sql`deleted_at IS NULL`),
    cardCodeIdx: uniqueIndex('students_tenant_card_code_idx')
      .on(table.tenantId, table.cardCode)
      .where(sql`deleted_at IS NULL AND card_code IS NOT NULL`),
  }),
);

export type Student = typeof students.$inferSelect;
export type NewStudent = typeof students.$inferInsert;
