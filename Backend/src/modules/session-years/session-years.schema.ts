import { sql } from 'drizzle-orm';
import {
  boolean,
  date,
  index,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { tenants } from '../tenants/tenants.schema.js';
import { classes } from '../classes/classes.schema.js';
import { sections } from '../sections/sections.schema.js';
import { students } from '../students/students.schema.js';

export const sessionYears = pgTable(
  'session_years',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 50 }).notNull(),
    startDate: date('start_date').notNull(),
    endDate: date('end_date').notNull(),
    status: varchar('status', { length: 20 }).default('planned').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    tenantIdx: index('session_years_tenant_idx').on(table.tenantId),
    tenantNameIdx: uniqueIndex('session_years_tenant_name_idx')
      .on(table.tenantId, table.name)
      .where(sql`deleted_at IS NULL`),
    tenantStatusIdx: index('session_years_tenant_status_idx').on(
      table.tenantId,
      table.status,
    ),
  }),
);

export const studentPlacements = pgTable(
  'student_placements',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    studentId: uuid('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'cascade' }),
    sessionYearId: uuid('session_year_id')
      .notNull()
      .references(() => sessionYears.id, { onDelete: 'restrict' }),
    classId: uuid('class_id')
      .notNull()
      .references(() => classes.id, { onDelete: 'restrict' }),
    sectionId: uuid('section_id')
      .notNull()
      .references(() => sections.id, { onDelete: 'restrict' }),
    status: varchar('status', { length: 20 }).default('enrolled').notNull(),
    isCurrent: boolean('is_current').default(true).notNull(),
    promotedFromPlacementId: uuid('promoted_from_placement_id'),
    notes: varchar('notes', { length: 500 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    tenantIdx: index('student_placements_tenant_idx').on(table.tenantId),
    studentIdx: index('student_placements_student_idx').on(table.studentId),
    sessionIdx: index('student_placements_session_idx').on(table.sessionYearId),
    studentSessionIdx: uniqueIndex('student_placements_student_session_idx').on(
      table.studentId,
      table.sessionYearId,
    ),
    currentIdx: index('student_placements_current_idx').on(
      table.tenantId,
      table.isCurrent,
    ),
  }),
);

export type SessionYear = typeof sessionYears.$inferSelect;
export type NewSessionYear = typeof sessionYears.$inferInsert;
export type StudentPlacement = typeof studentPlacements.$inferSelect;
export type NewStudentPlacement = typeof studentPlacements.$inferInsert;
