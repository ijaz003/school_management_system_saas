import { sql } from 'drizzle-orm';
import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { tenants } from '../tenants/tenants.schema.js';

export const classes = pgTable(
  'classes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 50 }).notNull(),
    order: integer('order').notNull(),
    type: varchar('type', { length: 20 }).default('common').notNull(),
    description: text('description'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    tenantIdx: index('classes_tenant_idx').on(table.tenantId),
    tenantNameIdx: uniqueIndex('classes_tenant_name_idx')
      .on(table.tenantId, table.name)
      .where(sql`deleted_at IS NULL`),
  }),
);

export type Class = typeof classes.$inferSelect;
export type NewClass = typeof classes.$inferInsert;
