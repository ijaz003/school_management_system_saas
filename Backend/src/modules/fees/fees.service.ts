import { and, desc, eq, ilike, isNull, or, sql } from 'drizzle-orm';
import { db } from '../../config/database.js';
import { BadRequestError, NotFoundError } from '../../lib/errors.js';
import { classes } from '../classes/classes.schema.js';
import { sections } from '../sections/sections.schema.js';
import { students } from '../students/students.schema.js';
import { users } from '../auth/auth.schema.js';
import { feeInvoices, feePayments, feeStructures } from './fees.schema.js';
import type {
  CreateFeeStructureInput,
  CreateInvoiceInput,
  GenerateInvoicesInput,
  ListFeeStructuresFilters,
  ListInvoicesFilters,
  RecordPaymentInput,
  UpdateFeeStructureInput,
} from './fees.types.js';

function deriveInvoiceStatus(amount: number, amountPaid: number, current: string) {
  if (current === 'cancelled' || current === 'draft') return current;
  if (amountPaid <= 0) return 'issued';
  if (amountPaid >= amount) return 'paid';
  return 'partial';
}

async function requireStructure(structureId: string, tenantId: string) {
  const [row] = await db
    .select()
    .from(feeStructures)
    .where(
      and(
        eq(feeStructures.id, structureId),
        eq(feeStructures.tenantId, tenantId),
        isNull(feeStructures.deletedAt),
      ),
    )
    .limit(1);
  if (!row) throw new NotFoundError('Fee structure');
  return row;
}

async function requireInvoice(invoiceId: string, tenantId: string) {
  const [row] = await db
    .select()
    .from(feeInvoices)
    .where(
      and(
        eq(feeInvoices.id, invoiceId),
        eq(feeInvoices.tenantId, tenantId),
        isNull(feeInvoices.deletedAt),
      ),
    )
    .limit(1);
  if (!row) throw new NotFoundError('Invoice');
  return row;
}

async function requireStudent(studentId: string, tenantId: string) {
  const [row] = await db
    .select()
    .from(students)
    .where(
      and(
        eq(students.id, studentId),
        eq(students.tenantId, tenantId),
        isNull(students.deletedAt),
      ),
    )
    .limit(1);
  if (!row) throw new NotFoundError('Student');
  return row;
}

async function requireClass(classId: string, tenantId: string) {
  const [row] = await db
    .select()
    .from(classes)
    .where(
      and(
        eq(classes.id, classId),
        eq(classes.tenantId, tenantId),
        isNull(classes.deletedAt),
      ),
    )
    .limit(1);
  if (!row) throw new NotFoundError('Class');
  return row;
}

function mapStructure(row: {
  id: string;
  name: string;
  classId: string | null;
  className: string | null;
  amount: number;
  frequency: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: row.id,
    name: row.name,
    classId: row.classId,
    className: row.className,
    amount: row.amount,
    frequency: row.frequency,
    description: row.description,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapInvoice(row: {
  id: string;
  studentId: string;
  studentName: string | null;
  admissionNo: string | null;
  className: string | null;
  sectionName: string | null;
  feeStructureId: string | null;
  title: string;
  periodLabel: string | null;
  amount: number;
  amountPaid: number;
  dueDate: string;
  status: string;
  notes: string | null;
  createdBy: string | null;
  createdByName: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: row.id,
    studentId: row.studentId,
    studentName: row.studentName,
    admissionNo: row.admissionNo,
    className: row.className,
    sectionName: row.sectionName,
    feeStructureId: row.feeStructureId,
    title: row.title,
    periodLabel: row.periodLabel,
    amount: row.amount,
    amountPaid: row.amountPaid,
    balance: Math.max(0, row.amount - row.amountPaid),
    dueDate: row.dueDate,
    status: row.status,
    notes: row.notes,
    createdBy: row.createdBy,
    createdByName: row.createdByName,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function listFeeStructures(filters: ListFeeStructuresFilters) {
  const conditions = [
    eq(feeStructures.tenantId, filters.tenantId),
    isNull(feeStructures.deletedAt),
  ];
  if (filters.classId) conditions.push(eq(feeStructures.classId, filters.classId));
  if (filters.activeOnly) conditions.push(eq(feeStructures.isActive, true));

  const rows = await db
    .select({
      id: feeStructures.id,
      name: feeStructures.name,
      classId: feeStructures.classId,
      className: classes.name,
      amount: feeStructures.amount,
      frequency: feeStructures.frequency,
      description: feeStructures.description,
      isActive: feeStructures.isActive,
      createdAt: feeStructures.createdAt,
      updatedAt: feeStructures.updatedAt,
    })
    .from(feeStructures)
    .leftJoin(classes, eq(feeStructures.classId, classes.id))
    .where(and(...conditions))
    .orderBy(desc(feeStructures.createdAt));

  return rows.map(mapStructure);
}

export async function createFeeStructure(input: CreateFeeStructureInput) {
  if (input.data.classId) {
    await requireClass(input.data.classId, input.tenantId);
  }

  const [created] = await db
    .insert(feeStructures)
    .values({
      tenantId: input.tenantId,
      name: input.data.name.trim(),
      classId: input.data.classId ?? null,
      amount: input.data.amount,
      frequency: input.data.frequency ?? 'monthly',
      description: input.data.description?.trim() || null,
    })
    .returning({ id: feeStructures.id });

  if (!created) throw new BadRequestError('Could not create fee structure');
  const [row] = await db
    .select({
      id: feeStructures.id,
      name: feeStructures.name,
      classId: feeStructures.classId,
      className: classes.name,
      amount: feeStructures.amount,
      frequency: feeStructures.frequency,
      description: feeStructures.description,
      isActive: feeStructures.isActive,
      createdAt: feeStructures.createdAt,
      updatedAt: feeStructures.updatedAt,
    })
    .from(feeStructures)
    .leftJoin(classes, eq(feeStructures.classId, classes.id))
    .where(eq(feeStructures.id, created.id))
    .limit(1);
  if (!row) throw new NotFoundError('Fee structure');
  return mapStructure(row);
}

export async function updateFeeStructure(input: UpdateFeeStructureInput) {
  const existing = await requireStructure(input.structureId, input.tenantId);
  if (input.data.classId) {
    await requireClass(input.data.classId, input.tenantId);
  }

  await db
    .update(feeStructures)
    .set({
      ...(input.data.name !== undefined ? { name: input.data.name.trim() } : {}),
      ...(input.data.classId !== undefined ? { classId: input.data.classId } : {}),
      ...(input.data.amount !== undefined ? { amount: input.data.amount } : {}),
      ...(input.data.frequency !== undefined ? { frequency: input.data.frequency } : {}),
      ...(input.data.description !== undefined
        ? { description: input.data.description?.trim() || null }
        : {}),
      ...(input.data.isActive !== undefined ? { isActive: input.data.isActive } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(feeStructures.id, existing.id), eq(feeStructures.tenantId, input.tenantId)));

  const [row] = await db
    .select({
      id: feeStructures.id,
      name: feeStructures.name,
      classId: feeStructures.classId,
      className: classes.name,
      amount: feeStructures.amount,
      frequency: feeStructures.frequency,
      description: feeStructures.description,
      isActive: feeStructures.isActive,
      createdAt: feeStructures.createdAt,
      updatedAt: feeStructures.updatedAt,
    })
    .from(feeStructures)
    .leftJoin(classes, eq(feeStructures.classId, classes.id))
    .where(eq(feeStructures.id, existing.id))
    .limit(1);
  if (!row) throw new NotFoundError('Fee structure');
  return mapStructure(row);
}

export async function deleteFeeStructure(structureId: string, tenantId: string) {
  const existing = await requireStructure(structureId, tenantId);
  await db
    .update(feeStructures)
    .set({ deletedAt: new Date(), updatedAt: new Date(), isActive: false })
    .where(and(eq(feeStructures.id, existing.id), eq(feeStructures.tenantId, tenantId)));
}

async function getInvoiceMapped(invoiceId: string, tenantId: string) {
  const [row] = await db
    .select({
      id: feeInvoices.id,
      studentId: feeInvoices.studentId,
      studentName: students.fullName,
      admissionNo: students.admissionNo,
      className: classes.name,
      sectionName: sections.name,
      feeStructureId: feeInvoices.feeStructureId,
      title: feeInvoices.title,
      periodLabel: feeInvoices.periodLabel,
      amount: feeInvoices.amount,
      amountPaid: feeInvoices.amountPaid,
      dueDate: feeInvoices.dueDate,
      status: feeInvoices.status,
      notes: feeInvoices.notes,
      createdBy: feeInvoices.createdBy,
      createdByName: users.fullName,
      createdAt: feeInvoices.createdAt,
      updatedAt: feeInvoices.updatedAt,
    })
    .from(feeInvoices)
    .innerJoin(students, eq(feeInvoices.studentId, students.id))
    .leftJoin(classes, eq(students.classId, classes.id))
    .leftJoin(sections, eq(students.sectionId, sections.id))
    .leftJoin(users, eq(feeInvoices.createdBy, users.id))
    .where(
      and(
        eq(feeInvoices.id, invoiceId),
        eq(feeInvoices.tenantId, tenantId),
        isNull(feeInvoices.deletedAt),
      ),
    )
    .limit(1);
  if (!row) throw new NotFoundError('Invoice');
  return mapInvoice(row);
}

export async function listInvoices(filters: ListInvoicesFilters) {
  const { tenantId, page = 1, limit = 20, search, status, studentId, classId } = filters;
  const conditions = [eq(feeInvoices.tenantId, tenantId), isNull(feeInvoices.deletedAt)];
  if (status) conditions.push(eq(feeInvoices.status, status));
  if (studentId) conditions.push(eq(feeInvoices.studentId, studentId));
  if (classId) conditions.push(eq(students.classId, classId));
  if (search) {
    const escaped = `%${search.replace(/[\\%_]/g, '\\$&')}%`;
    const searchFilter = or(
      ilike(feeInvoices.title, escaped),
      ilike(students.fullName, escaped),
      ilike(students.admissionNo, escaped),
      ilike(feeInvoices.periodLabel, escaped),
    );
    if (searchFilter) conditions.push(searchFilter);
  }

  const where = and(...conditions);
  const offset = (page - 1) * limit;

  const [rows, countRows] = await Promise.all([
    db
      .select({
        id: feeInvoices.id,
        studentId: feeInvoices.studentId,
        studentName: students.fullName,
        admissionNo: students.admissionNo,
        className: classes.name,
        sectionName: sections.name,
        feeStructureId: feeInvoices.feeStructureId,
        title: feeInvoices.title,
        periodLabel: feeInvoices.periodLabel,
        amount: feeInvoices.amount,
        amountPaid: feeInvoices.amountPaid,
        dueDate: feeInvoices.dueDate,
        status: feeInvoices.status,
        notes: feeInvoices.notes,
        createdBy: feeInvoices.createdBy,
        createdByName: users.fullName,
        createdAt: feeInvoices.createdAt,
        updatedAt: feeInvoices.updatedAt,
      })
      .from(feeInvoices)
      .innerJoin(students, eq(feeInvoices.studentId, students.id))
      .leftJoin(classes, eq(students.classId, classes.id))
      .leftJoin(sections, eq(students.sectionId, sections.id))
      .leftJoin(users, eq(feeInvoices.createdBy, users.id))
      .where(where)
      .orderBy(desc(feeInvoices.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(feeInvoices)
      .innerJoin(students, eq(feeInvoices.studentId, students.id))
      .where(where),
  ]);

  const total = countRows[0]?.count ?? 0;
  return {
    items: rows.map(mapInvoice),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
}

export async function getInvoiceById(invoiceId: string, tenantId: string) {
  const invoice = await getInvoiceMapped(invoiceId, tenantId);
  const payments = await db
    .select({
      id: feePayments.id,
      amount: feePayments.amount,
      method: feePayments.method,
      paidAt: feePayments.paidAt,
      reference: feePayments.reference,
      notes: feePayments.notes,
      recordedBy: feePayments.recordedBy,
      recordedByName: users.fullName,
      createdAt: feePayments.createdAt,
    })
    .from(feePayments)
    .leftJoin(users, eq(feePayments.recordedBy, users.id))
    .where(
      and(
        eq(feePayments.invoiceId, invoiceId),
        eq(feePayments.tenantId, tenantId),
        isNull(feePayments.deletedAt),
      ),
    )
    .orderBy(desc(feePayments.paidAt));

  return { ...invoice, payments };
}

export async function createInvoice(input: CreateInvoiceInput) {
  const student = await requireStudent(input.data.studentId, input.tenantId);
  let amount = input.data.amount;
  let title = input.data.title?.trim();
  let feeStructureId = input.data.feeStructureId ?? null;

  if (feeStructureId) {
    const structure = await requireStructure(feeStructureId, input.tenantId);
    if (!structure.isActive) throw new BadRequestError('Fee structure is inactive');
    amount = amount ?? structure.amount;
    title = title || structure.name;
  }

  if (amount === undefined || amount <= 0) {
    throw new BadRequestError('Invoice amount is required');
  }
  if (!title) throw new BadRequestError('Invoice title is required');

  const issue = input.data.issue !== false;
  const [created] = await db
    .insert(feeInvoices)
    .values({
      tenantId: input.tenantId,
      studentId: student.id,
      feeStructureId,
      title,
      periodLabel: input.data.periodLabel?.trim() || null,
      amount,
      amountPaid: 0,
      dueDate: input.data.dueDate,
      status: issue ? 'issued' : 'draft',
      notes: input.data.notes?.trim() || null,
      createdBy: input.createdBy,
    })
    .returning({ id: feeInvoices.id });

  if (!created) throw new BadRequestError('Could not create invoice');
  return getInvoiceById(created.id, input.tenantId);
}

export async function generateInvoices(input: GenerateInvoicesInput) {
  const structure = await requireStructure(input.data.feeStructureId, input.tenantId);
  if (!structure.isActive) throw new BadRequestError('Fee structure is inactive');

  const classId = input.data.classId ?? structure.classId;
  if (!classId) {
    throw new BadRequestError('classId is required when the fee structure is not class-specific');
  }
  await requireClass(classId, input.tenantId);

  const studentConditions = [
    eq(students.tenantId, input.tenantId),
    eq(students.classId, classId),
    eq(students.status, 'active'),
    isNull(students.deletedAt),
  ];
  if (input.data.sectionId) {
    studentConditions.push(eq(students.sectionId, input.data.sectionId));
  }

  const targetStudents = await db
    .select({ id: students.id })
    .from(students)
    .where(and(...studentConditions));

  if (targetStudents.length === 0) {
    throw new BadRequestError('No active students found for generation');
  }

  const title = input.data.periodLabel
    ? `${structure.name} — ${input.data.periodLabel}`
    : structure.name;

  const createdIds: string[] = [];
  for (const student of targetStudents) {
    const [created] = await db
      .insert(feeInvoices)
      .values({
        tenantId: input.tenantId,
        studentId: student.id,
        feeStructureId: structure.id,
        title,
        periodLabel: input.data.periodLabel.trim(),
        amount: structure.amount,
        amountPaid: 0,
        dueDate: input.data.dueDate,
        status: 'issued',
        notes: input.data.notes?.trim() || null,
        createdBy: input.createdBy,
      })
      .returning({ id: feeInvoices.id });
    if (created) createdIds.push(created.id);
  }

  return { createdCount: createdIds.length, invoiceIds: createdIds };
}

export async function issueInvoice(invoiceId: string, tenantId: string) {
  const invoice = await requireInvoice(invoiceId, tenantId);
  if (invoice.status !== 'draft') {
    throw new BadRequestError('Only draft invoices can be issued');
  }
  await db
    .update(feeInvoices)
    .set({ status: 'issued', updatedAt: new Date() })
    .where(and(eq(feeInvoices.id, invoice.id), eq(feeInvoices.tenantId, tenantId)));
  return getInvoiceById(invoice.id, tenantId);
}

export async function recordPayment(input: RecordPaymentInput) {
  const invoice = await requireInvoice(input.invoiceId, input.tenantId);
  if (invoice.status === 'cancelled') {
    throw new BadRequestError('Cannot record payment on a cancelled invoice');
  }
  if (invoice.status === 'draft') {
    throw new BadRequestError('Issue the invoice before recording payments');
  }
  if (invoice.status === 'paid') {
    throw new BadRequestError('Invoice is already fully paid');
  }

  const balance = invoice.amount - invoice.amountPaid;
  if (input.data.amount > balance) {
    throw new BadRequestError(`Payment exceeds balance of ${balance}`);
  }

  const paidAt = input.data.paidAt ? new Date(input.data.paidAt) : new Date();

  await db.transaction(async (tx) => {
    await tx.insert(feePayments).values({
      tenantId: input.tenantId,
      invoiceId: invoice.id,
      amount: input.data.amount,
      method: input.data.method ?? 'cash',
      paidAt,
      reference: input.data.reference?.trim() || null,
      notes: input.data.notes?.trim() || null,
      recordedBy: input.recordedBy,
    });

    const newPaid = invoice.amountPaid + input.data.amount;
    await tx
      .update(feeInvoices)
      .set({
        amountPaid: newPaid,
        status: deriveInvoiceStatus(invoice.amount, newPaid, invoice.status),
        updatedAt: new Date(),
      })
      .where(and(eq(feeInvoices.id, invoice.id), eq(feeInvoices.tenantId, input.tenantId)));
  });

  return getInvoiceById(invoice.id, input.tenantId);
}

export async function voidPayment(paymentId: string, tenantId: string) {
  const [payment] = await db
    .select()
    .from(feePayments)
    .where(
      and(
        eq(feePayments.id, paymentId),
        eq(feePayments.tenantId, tenantId),
        isNull(feePayments.deletedAt),
      ),
    )
    .limit(1);
  if (!payment) throw new NotFoundError('Payment');

  const invoice = await requireInvoice(payment.invoiceId, tenantId);

  await db.transaction(async (tx) => {
    await tx
      .update(feePayments)
      .set({ deletedAt: new Date() })
      .where(eq(feePayments.id, payment.id));

    const newPaid = Math.max(0, invoice.amountPaid - payment.amount);
    await tx
      .update(feeInvoices)
      .set({
        amountPaid: newPaid,
        status: deriveInvoiceStatus(invoice.amount, newPaid, 'issued'),
        updatedAt: new Date(),
      })
      .where(and(eq(feeInvoices.id, invoice.id), eq(feeInvoices.tenantId, tenantId)));
  });

  return getInvoiceById(invoice.id, tenantId);
}
