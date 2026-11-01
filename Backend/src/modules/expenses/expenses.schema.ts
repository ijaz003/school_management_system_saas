import {
  boolean,
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { tenants } from '../tenants/tenants.schema.js';
import { users } from '../auth/auth.schema.js';

export const expenseCategories = pgTable(
  'expense_categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 120 }).notNull(),
    description: text('description'),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    tenantIdx: index('expense_categories_tenant_idx').on(table.tenantId),
    nameIdx: index('expense_categories_name_idx').on(table.tenantId, table.name),
  }),
);

export const expenses = pgTable(
  'expenses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id').references(() => expenseCategories.id, {
      onDelete: 'set null',
    }),
    title: varchar('title', { length: 200 }).notNull(),
    amount: integer('amount').notNull(),
    expenseDate: date('expense_date').notNull(),
    paymentMethod: varchar('payment_method', { length: 30 })
      .default('cash')
      .notNull(),
    vendor: varchar('vendor', { length: 150 }),
    reference: varchar('reference', { length: 100 }),
    notes: text('notes'),
    status: varchar('status', { length: 20 }).default('recorded').notNull(),
    createdBy: uuid('created_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    tenantIdx: index('expenses_tenant_idx').on(table.tenantId),
    categoryIdx: index('expenses_category_idx').on(table.categoryId),
    dateIdx: index('expenses_date_idx').on(table.tenantId, table.expenseDate),
    statusIdx: index('expenses_status_idx').on(table.tenantId, table.status),
  }),
);

export type ExpenseCategory = typeof expenseCategories.$inferSelect;
export type NewExpenseCategory = typeof expenseCategories.$inferInsert;
export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;
