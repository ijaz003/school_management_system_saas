import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { tenants } from '../tenants/tenants.schema.js';

export const permissions = pgTable('permissions', {
  id: uuid('id').primaryKey().defaultRandom(),

  key: varchar('key', { length: 100 }).notNull().unique(),
  displayName: varchar('display_name', { length: 150 }).notNull(),
  description: text('description'),

  module: varchar('module', { length: 50 }).notNull(),
  action: varchar('action', { length: 30 }).notNull(),
  category: varchar('category', { length: 50 }),

  isActive: boolean('is_active').default(true).notNull(),
  isAssignableToSchools: boolean('is_assignable_to_schools')
    .default(true)
    .notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const roles = pgTable(
  'roles',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    tenantId: uuid('tenant_id').references(() => tenants.id, {
      onDelete: 'cascade',
    }),

    name: varchar('name', { length: 50 }).notNull(),
    displayName: varchar('display_name', { length: 100 }).notNull(),
    description: text('description'),

    permissions: jsonb('permissions').$type<string[]>().default([]).notNull(),

    isSystem: boolean('is_system').default(false).notNull(),
    isSuperAdmin: boolean('is_super_admin').default(false).notNull(),

    color: varchar('color', { length: 20 }).default('#2563eb'),
    icon: varchar('icon', { length: 50 }),
    category: varchar('category', { length: 30 }),
    isVisible: boolean('is_visible').default(true).notNull(),

    createdBy: uuid('created_by'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    tenantNameIdx: index('roles_tenant_name_idx').on(
      table.tenantId,
      table.name,
    ),
  }),
);

export type Permission = typeof permissions.$inferSelect;
export type NewPermission = typeof permissions.$inferInsert;
export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;
