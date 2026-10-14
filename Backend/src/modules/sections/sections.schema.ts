import { sql } from 'drizzle-orm';
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
import { tenants } from '../tenants/tenants.schema.js';
import { users } from '../auth/auth.schema.js';
import { classes } from '../classes/classes.schema.js';

export const sections = pgTable(
  'sections',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    classId: uuid('class_id')
      .notNull()
      .references(() => classes.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 20 }).notNull(),
    fullName: varchar('full_name', { length: 50 }).notNull(),
    useClassSubjects: boolean('use_class_subjects').default(true).notNull(),
    stream: varchar('stream', { length: 50 }),
    capacity: integer('capacity').default(40).notNull(),
    classTeacherId: uuid('class_teacher_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    tenantIdx: index('sections_tenant_idx').on(table.tenantId),
    classIdx: index('sections_class_idx').on(table.classId),
    classSectionIdx: uniqueIndex('sections_class_name_idx')
      .on(table.classId, table.name)
      .where(sql`deleted_at IS NULL`),
  }),
);

export type Section = typeof sections.$inferSelect;
export type NewSection = typeof sections.$inferInsert;
