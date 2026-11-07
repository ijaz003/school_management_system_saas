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
import { classes } from '../classes/classes.schema.js';
import { sections } from '../sections/sections.schema.js';
import { students } from '../students/students.schema.js';

export const feeStructures = pgTable(
  'fee_structures',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 150 }).notNull(),
    classId: uuid('class_id').references(() => classes.id, {
      onDelete: 'set null',
    }),
    sectionId: uuid('section_id').references(() => sections.id, {
      onDelete: 'set null',
    }),
    amount: integer('amount').notNull(),
    frequency: varchar('frequency', { length: 20 }).default('monthly').notNull(),
    description: text('description'),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    tenantIdx: index('fee_structures_tenant_idx').on(table.tenantId),
    classIdx: index('fee_structures_class_idx').on(table.classId),
    sectionIdx: index('fee_structures_section_idx').on(table.sectionId),
  }),
);

export const feeInvoices = pgTable(
  'fee_invoices',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    studentId: uuid('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'restrict' }),
    feeStructureId: uuid('fee_structure_id').references(() => feeStructures.id, {
      onDelete: 'set null',
    }),
    title: varchar('title', { length: 200 }).notNull(),
    periodLabel: varchar('period_label', { length: 100 }),
    amount: integer('amount').notNull(),
    amountPaid: integer('amount_paid').default(0).notNull(),
    dueDate: date('due_date').notNull(),
    status: varchar('status', { length: 20 }).default('issued').notNull(),
    notes: text('notes'),
    createdBy: uuid('created_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    tenantIdx: index('fee_invoices_tenant_idx').on(table.tenantId),
    studentIdx: index('fee_invoices_student_idx').on(table.studentId),
    statusIdx: index('fee_invoices_status_idx').on(table.tenantId, table.status),
    dueIdx: index('fee_invoices_due_idx').on(table.tenantId, table.dueDate),
  }),
);

export const feePayments = pgTable(
  'fee_payments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    invoiceId: uuid('invoice_id')
      .notNull()
      .references(() => feeInvoices.id, { onDelete: 'cascade' }),
    amount: integer('amount').notNull(),
    method: varchar('method', { length: 30 }).default('cash').notNull(),
    paidAt: timestamp('paid_at').defaultNow().notNull(),
    reference: varchar('reference', { length: 100 }),
    notes: text('notes'),
    recordedBy: uuid('recorded_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    tenantIdx: index('fee_payments_tenant_idx').on(table.tenantId),
    invoiceIdx: index('fee_payments_invoice_idx').on(table.invoiceId),
  }),
);

export type FeeStructure = typeof feeStructures.$inferSelect;
export type NewFeeStructure = typeof feeStructures.$inferInsert;
export type FeeInvoice = typeof feeInvoices.$inferSelect;
export type NewFeeInvoice = typeof feeInvoices.$inferInsert;
export type FeePayment = typeof feePayments.$inferSelect;
export type NewFeePayment = typeof feePayments.$inferInsert;
