import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { tenants } from '../tenants/tenants.schema.js';

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    tenantId: uuid('tenant_id').references(() => tenants.id, {
      onDelete: 'cascade',
    }),

    email: varchar('email', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 20 }),
    passwordHash: text('password_hash').notNull(),
    fullName: varchar('full_name', { length: 200 }).notNull(),
    avatarUrl: text('avatar_url'),

    roleId: uuid('role_id'),
    role: varchar('role', { length: 50 }).notNull(),
    permissions: jsonb('permissions').$type<string[]>().default([]).notNull(),

    isActive: boolean('is_active').default(true).notNull(),
    isEmailVerified: boolean('is_email_verified').default(false).notNull(),
    emailVerifiedAt: timestamp('email_verified_at'),

    twoFactorEnabled: boolean('two_factor_enabled').default(false).notNull(),
    twoFactorSecret: text('two_factor_secret'),

    lastLoginAt: timestamp('last_login_at'),
    lastLoginIp: varchar('last_login_ip', { length: 45 }),
    failedLoginAttempts: varchar('failed_login_attempts', { length: 10 })
      .default('0')
      .notNull(),
    lockedUntil: timestamp('locked_until'),

    resetToken: text('reset_token'),
    resetTokenExpiry: timestamp('reset_token_expiry'),

    metadata: jsonb('metadata').$type<Record<string, unknown>>(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    emailTenantIdx: uniqueIndex('users_email_tenant_idx').on(
      table.email,
      table.tenantId,
    ),
    tenantIdx: index('users_tenant_idx').on(table.tenantId),
    roleIdx: index('users_role_idx').on(table.role),
  }),
);

export const refreshTokens = pgTable(
  'refresh_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    token: text('token').notNull().unique(),
    userAgent: text('user_agent'),
    ipAddress: varchar('ip_address', { length: 45 }),
    expiresAt: timestamp('expires_at').notNull(),
    revokedAt: timestamp('revoked_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index('refresh_tokens_user_idx').on(table.userId),
  }),
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type RefreshToken = typeof refreshTokens.$inferSelect;
export type NewRefreshToken = typeof refreshTokens.$inferInsert;
