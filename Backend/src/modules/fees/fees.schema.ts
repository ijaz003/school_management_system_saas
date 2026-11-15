import {
  boolean,
  check,
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { tenants } from '../tenants/tenants.schema.js';
import { users } from '../auth/auth.schema.js';
import { classes } from '../classes/classes.schema.js';
import { sections } from '../sections/sections.schema.js';
import { students } from '../students/students.schema.js';
import type { ScheduleType } from './fees.types.js';

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

export const feeHeads = pgTable(
  'fee_heads',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 150 }).notNull(),
    code: varchar('code', { length: 30 }).notNull(),
    type: varchar('type', { length: 20 }).default('monthly').notNull(),
    description: text('description'),
    isActive: boolean('is_active').default(true).notNull(),
    isMandatory: boolean('is_mandatory').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    tenantIdx: index('fee_heads_tenant_idx').on(table.tenantId),
    tenantCodeIdx: uniqueIndex('fee_heads_tenant_code_idx')
      .on(table.tenantId, table.code)
      .where(sql`${table.deletedAt} IS NULL`),
  }),
);

export const feeStructureItems = pgTable(
  'fee_structure_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    structureId: uuid('structure_id')
      .notNull()
      .references(() => feeStructures.id, { onDelete: 'cascade' }),
    feeHeadId: uuid('fee_head_id')
      .notNull()
      .references(() => feeHeads.id, { onDelete: 'restrict' }),
    amount: integer('amount').notNull(),
    scheduleType: varchar('schedule_type', { length: 20 })
      .$type<ScheduleType>()
      .default('monthly')
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    structureIdx: index('fee_structure_items_structure_idx').on(table.structureId),
    headIdx: index('fee_structure_items_head_idx').on(table.feeHeadId),
    scheduleTypeCheck: check(
      'fee_structure_items_schedule_type_check',
      sql`${table.scheduleType} IN ('monthly', 'specific_months', 'one_time')`,
    ),
  }),
);

export const feeStructureItemSchedules = pgTable(
  'fee_structure_item_schedules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    structureItemId: uuid('structure_item_id')
      .notNull()
      .references(() => feeStructureItems.id, { onDelete: 'cascade' }),
    month: integer('month').notNull(),
    academicYear: varchar('academic_year', { length: 50 }),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    itemIdx: index('fee_structure_item_schedules_item_idx').on(
      table.tenantId,
      table.structureItemId,
    ),
    uniqueScheduleIdx: uniqueIndex('fee_structure_item_schedules_unique_idx').on(
      table.tenantId,
      table.structureItemId,
      table.month,
      sql`coalesce(${table.academicYear}, '')`,
    ),
    monthCheck: check(
      'fee_structure_item_schedules_month_check',
      sql`${table.month} BETWEEN 1 AND 12`,
    ),
  }),
);

export const feeInvoiceItems = pgTable(
  'fee_invoice_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    invoiceId: uuid('invoice_id')
      .notNull()
      .references(() => feeInvoices.id, { onDelete: 'cascade' }),
    feeHeadId: uuid('fee_head_id').references(() => feeHeads.id, {
      onDelete: 'set null',
    }),
    name: varchar('name', { length: 150 }).notNull(),
    amount: integer('amount').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    invoiceIdx: index('fee_invoice_items_invoice_idx').on(table.invoiceId),
  }),
);

export type FeeStructure = typeof feeStructures.$inferSelect;
export type NewFeeStructure = typeof feeStructures.$inferInsert;
export type FeeInvoice = typeof feeInvoices.$inferSelect;
export type NewFeeInvoice = typeof feeInvoices.$inferInsert;
export type FeePayment = typeof feePayments.$inferSelect;
export type NewFeePayment = typeof feePayments.$inferInsert;
export type FeeHead = typeof feeHeads.$inferSelect;
export type NewFeeHead = typeof feeHeads.$inferInsert;
export type FeeStructureItem = typeof feeStructureItems.$inferSelect;
export type NewFeeStructureItem = typeof feeStructureItems.$inferInsert;
export type FeeStructureItemSchedule = typeof feeStructureItemSchedules.$inferSelect;
export type NewFeeStructureItemSchedule = typeof feeStructureItemSchedules.$inferInsert;
export type FeeInvoiceItem = typeof feeInvoiceItems.$inferSelect;
export type NewFeeInvoiceItem = typeof feeInvoiceItems.$inferInsert;
