import {
  date,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { tenants } from '../tenants/tenants.schema.js';
import { users } from '../auth/auth.schema.js';
import { classes } from '../classes/classes.schema.js';
import { sections } from '../sections/sections.schema.js';

export const diaryEntries = pgTable(
  'diary_entries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    entryDate: date('entry_date').notNull(),
    classId: uuid('class_id')
      .notNull()
      .references(() => classes.id, { onDelete: 'restrict' }),
    sectionId: uuid('section_id').references(() => sections.id, {
      onDelete: 'set null',
    }),
    title: varchar('title', { length: 200 }).notNull(),
    homework: text('homework').notNull(),
    classwork: text('classwork'),
    remarks: text('remarks'),
    status: varchar('status', { length: 20 }).default('draft').notNull(),
    publishedAt: timestamp('published_at'),
    createdBy: uuid('created_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    tenantDateIdx: index('diary_entries_tenant_date_idx').on(
      table.tenantId,
      table.entryDate,
    ),
    tenantClassIdx: index('diary_entries_tenant_class_idx').on(
      table.tenantId,
      table.classId,
    ),
    statusIdx: index('diary_entries_status_idx').on(table.tenantId, table.status),
  }),
);

export type DiaryEntry = typeof diaryEntries.$inferSelect;
export type NewDiaryEntry = typeof diaryEntries.$inferInsert;
