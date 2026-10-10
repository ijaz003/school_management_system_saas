import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const planEnum = pgEnum('plan', ['basic', 'standard', 'premium']);

export const tenantStatusEnum = pgEnum('tenant_status', [
  'trial',
  'active',
  'suspended',
  'cancelled',
]);

export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),

  name: varchar('name', { length: 200 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  customDomain: varchar('custom_domain', { length: 200 }).unique(),
  domainVerified: boolean('domain_verified').default(false).notNull(),

  ownerName: varchar('owner_name', { length: 200 }).notNull(),
  ownerEmail: varchar('owner_email', { length: 200 }).notNull(),
  ownerPhone: varchar('owner_phone', { length: 20 }).notNull(),

  city: varchar('city', { length: 100 }),
  address: text('address'),
  logoUrl: text('logo_url'),

  plan: planEnum('plan').default('basic').notNull(),
  status: tenantStatusEnum('status').default('trial').notNull(),
  trialEndsAt: timestamp('trial_ends_at'),
  subscriptionEndsAt: timestamp('subscription_ends_at'),

  maxStudents: integer('max_students').default(500).notNull(),
  maxTeachers: integer('max_teachers').default(50).notNull(),
  maxSmsPerMonth: integer('max_sms_per_month').default(100).notNull(),
  maxCustomRoles: integer('max_custom_roles').default(5).notNull(),

  allowedPermissions: jsonb('allowed_permissions')
    .$type<string[]>()
    .default([])
    .notNull(),
  settings: jsonb('settings').$type<{
    academicYear?: string;
    gradingSystem?: string;
    timezone?: string;
    currency?: string;
  }>(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;
