import {
  boolean,
  index,
  integer,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { tenants } from '../tenants/tenants.schema.js';
import { users } from '../auth/auth.schema.js';
import { sections } from '../sections/sections.schema.js';
import { subjects } from '../subjects/subjects.schema.js';

export const timetablePeriods = pgTable(
  'timetable_periods',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 80 }).notNull(),
    sortOrder: integer('sort_order').default(0).notNull(),
    startTime: varchar('start_time', { length: 5 }).notNull(),
    endTime: varchar('end_time', { length: 5 }).notNull(),
    isBreak: boolean('is_break').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    tenantIdx: index('timetable_periods_tenant_idx').on(table.tenantId),
    orderIdx: index('timetable_periods_order_idx').on(table.tenantId, table.sortOrder),
  }),
);

export const timetableEntries = pgTable(
  'timetable_entries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    sectionId: uuid('section_id')
      .notNull()
      .references(() => sections.id, { onDelete: 'cascade' }),
    periodId: uuid('period_id')
      .notNull()
      .references(() => timetablePeriods.id, { onDelete: 'cascade' }),
    dayOfWeek: integer('day_of_week').notNull(),
    subjectId: uuid('subject_id').references(() => subjects.id, {
      onDelete: 'set null',
    }),
    teacherId: uuid('teacher_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    room: varchar('room', { length: 80 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    tenantIdx: index('timetable_entries_tenant_idx').on(table.tenantId),
    sectionIdx: index('timetable_entries_section_idx').on(table.sectionId),
    periodIdx: index('timetable_entries_period_idx').on(table.periodId),
    slotIdx: uniqueIndex('timetable_entries_slot_idx')
      .on(table.tenantId, table.sectionId, table.dayOfWeek, table.periodId)
      .where(sql`deleted_at IS NULL`),
  }),
);

export type TimetablePeriod = typeof timetablePeriods.$inferSelect;
export type NewTimetablePeriod = typeof timetablePeriods.$inferInsert;
export type TimetableEntry = typeof timetableEntries.$inferSelect;
export type NewTimetableEntry = typeof timetableEntries.$inferInsert;
