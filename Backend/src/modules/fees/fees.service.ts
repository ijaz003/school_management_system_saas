import {
  and,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  isNull,
  lte,
  ne,
  or,
  sql,
} from 'drizzle-orm';
import { db } from '../../config/database.js';
import { BadRequestError, NotFoundError } from '../../lib/errors.js';
import { classes } from '../classes/classes.schema.js';
import { sections } from '../sections/sections.schema.js';
import { students } from '../students/students.schema.js';
import { users } from '../auth/auth.schema.js';
import { sessionYears } from '../session-years/session-years.schema.js';
import {
  feeHeads,
  feeInvoiceItems,
  feeInvoices,
  feePayments,
  feeStructureItems,
  feeStructureItemSchedules,
  feeStructures,
} from './fees.schema.js';
import type {
  CreateFeeHeadInput,
  CreateFeeStructureInput,
  CreateInvoiceInput,
  GenerateInvoicesInput,
  ListFeeHeadsFilters,
  ListFeeStructuresFilters,
  ListInvoicesFilters,
  FeeStructurePreview,
  RecordPaymentInput,
  FeeStructureItemResponse,
  ScheduleType,
  PreviewInvoiceInput,
  UpdateFeeHeadInput,
  UpdateFeeStructureInput,
} from './fees.types.js';

const MAX_STRUCTURE_AMOUNT = 2_147_483_647;
type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

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

async function requireFeeHead(feeHeadId: string, tenantId: string) {
  const [row] = await db
    .select()
    .from(feeHeads)
    .where(
      and(
        eq(feeHeads.id, feeHeadId),
        eq(feeHeads.tenantId, tenantId),
        isNull(feeHeads.deletedAt),
      ),
    )
    .limit(1);
  if (!row) throw new NotFoundError('Fee head');
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

async function requireSectionForClass(
  sectionId: string,
  classId: string,
  tenantId: string,
) {
  const [section] = await db
    .select({ id: sections.id })
    .from(sections)
    .where(
      and(
        eq(sections.id, sectionId),
        eq(sections.classId, classId),
        eq(sections.tenantId, tenantId),
        isNull(sections.deletedAt),
      ),
    )
    .limit(1);
  if (!section) throw new BadRequestError('Section must belong to the selected class');
  return section;
}

function mapStructure(row: {
  id: string;
  name: string;
  classId: string | null;
  className: string | null;
  sectionId: string | null;
  sectionName: string | null;
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
    sectionId: row.sectionId,
    sectionName: row.sectionName,
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

export async function listFeeHeads(filters: ListFeeHeadsFilters) {
  const conditions = [
    eq(feeHeads.tenantId, filters.tenantId),
    isNull(feeHeads.deletedAt),
  ];
  if (filters.activeOnly) conditions.push(eq(feeHeads.isActive, true));
  if (filters.search) {
    const escaped = `%${filters.search.replace(/[\\%_]/g, '\\$&')}%`;
    const searchFilter = or(
      ilike(feeHeads.name, escaped),
      ilike(feeHeads.code, escaped),
    );
    if (searchFilter) conditions.push(searchFilter);
  }

  return db
    .select()
    .from(feeHeads)
    .where(and(...conditions))
    .orderBy(feeHeads.name);
}

async function saveStructureItems(
  tx: DbTransaction,
  structureId: string,
  tenantId: string,
  items: CreateFeeStructureInput['data']['items'],
) {
  const createdItems = await tx
    .insert(feeStructureItems)
    .values(
      items.map((item) => ({
        tenantId,
        structureId,
        feeHeadId: item.feeHeadId,
        amount: item.amount,
        scheduleType: item.scheduleType ?? 'monthly',
      })),
    )
    .returning({
      id: feeStructureItems.id,
      feeHeadId: feeStructureItems.feeHeadId,
    });

  const itemIdByFeeHead = new Map(
    createdItems.map((item) => [item.feeHeadId, item.id]),
  );
  const scheduleRows = items.flatMap((item) => {
    if ((item.scheduleType ?? 'monthly') === 'monthly') return [];
    const structureItemId = itemIdByFeeHead.get(item.feeHeadId);
    if (!structureItemId) throw new BadRequestError('Could not save fee structure item');
    return (item.months ?? []).map((month) => ({
      tenantId,
      structureItemId,
      month,
      academicYear: item.academicYear?.trim() || null,
    }));
  });
  if (scheduleRows.length > 0) {
    await tx.insert(feeStructureItemSchedules).values(scheduleRows);
  }
}

async function validateFeeHeads(feeHeadIds: string[], tenantId: string) {
  const uniqueIds = [...new Set(feeHeadIds)];
  if (uniqueIds.length !== feeHeadIds.length || uniqueIds.length === 0) {
    throw new BadRequestError('Select at least one unique fee head');
  }

  const rows = await db
    .select({ id: feeHeads.id })
    .from(feeHeads)
    .where(
      and(
        eq(feeHeads.tenantId, tenantId),
        eq(feeHeads.isActive, true),
        isNull(feeHeads.deletedAt),
        inArray(feeHeads.id, uniqueIds),
      ),
    );
  if (rows.length !== uniqueIds.length) {
    throw new BadRequestError('One or more fee heads are invalid or inactive');
  }
}

type StructureItemRow = {
  id: string;
  structureId: string;
  feeHeadId: string;
  feeHeadName: string;
  feeHeadCode: string;
  amount: number;
  scheduleType: ScheduleType;
};

async function addItemSchedules<T extends StructureItemRow>(
  items: T[],
  tenantId: string,
): Promise<Array<T & Pick<FeeStructureItemResponse, 'months' | 'academicYear'>>> {
  if (items.length === 0) return [];
  const schedules = await db
    .select({
      structureItemId: feeStructureItemSchedules.structureItemId,
      month: feeStructureItemSchedules.month,
      academicYear: feeStructureItemSchedules.academicYear,
    })
    .from(feeStructureItemSchedules)
    .where(
      and(
        eq(feeStructureItemSchedules.tenantId, tenantId),
        eq(feeStructureItemSchedules.isActive, true),
        inArray(feeStructureItemSchedules.structureItemId, items.map((item) => item.id)),
      ),
    )
    .orderBy(feeStructureItemSchedules.month);

  const schedulesByItem = new Map<string, { months: number[]; academicYear: string | null }>();
  for (const schedule of schedules) {
    const current = schedulesByItem.get(schedule.structureItemId) ?? {
      months: [],
      academicYear: schedule.academicYear,
    };
    current.months.push(schedule.month);
    schedulesByItem.set(schedule.structureItemId, current);
  }
  return items.map((item) => ({
    ...item,
    ...(schedulesByItem.get(item.id) ?? { months: [], academicYear: null }),
  }));
}

async function loadStructureItems(
  structureId: string,
  tenantId: string,
): Promise<FeeStructureItemResponse[]> {
  const items = await db
    .select({
      id: feeStructureItems.id,
      structureId: feeStructureItems.structureId,
      feeHeadId: feeStructureItems.feeHeadId,
      feeHeadName: feeHeads.name,
      feeHeadCode: feeHeads.code,
      amount: feeStructureItems.amount,
      scheduleType: feeStructureItems.scheduleType,
    })
    .from(feeStructureItems)
    .innerJoin(
      feeHeads,
      and(
        eq(feeStructureItems.feeHeadId, feeHeads.id),
        eq(feeHeads.tenantId, tenantId),
      ),
    )
    .where(
      and(
        eq(feeStructureItems.structureId, structureId),
        eq(feeStructureItems.tenantId, tenantId),
      ),
    )
    .orderBy(feeHeads.name);
  const itemsWithSchedules = await addItemSchedules(items, tenantId);
  return itemsWithSchedules.map(({ structureId: _structureId, ...item }) => item);
}

function parsePeriod(periodLabel: string) {
  const match =
    /\b(january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sept|sep|october|oct|november|nov|december|dec)\b/i.exec(
      periodLabel,
    );
  if (!match) {
    throw new BadRequestError(
      `Could not parse a month from "${periodLabel}". Use a label like "October 2026".`,
    );
  }
  const monthByPrefix: Record<string, number> = {
    jan: 1,
    feb: 2,
    mar: 3,
    apr: 4,
    may: 5,
    jun: 6,
    jul: 7,
    aug: 8,
    sep: 9,
    oct: 10,
    nov: 11,
    dec: 12,
  };
  const year = /\b(?:19|20)\d{2}\b/.exec(periodLabel)?.[0];
  return { month: monthByPrefix[match[1]!.toLowerCase().slice(0, 3)]!, year };
}

async function resolvePeriodAcademicYear(
  tenantId: string,
  periodLabel: string,
  required: boolean,
) {
  const { month, year } = parsePeriod(periodLabel);
  if (!year) {
    if (required) throw new BadRequestError('Include a calendar year in the period label');
    return { month, academicYear: null, calendarYear: null };
  }
  const periodDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const [sessionYear] = await db
    .select({ name: sessionYears.name })
    .from(sessionYears)
    .where(
      and(
        eq(sessionYears.tenantId, tenantId),
        lte(sessionYears.startDate, periodDate),
        gte(sessionYears.endDate, periodDate),
        isNull(sessionYears.deletedAt),
      ),
    )
    .limit(1);
  return { month, academicYear: sessionYear?.name ?? null, calendarYear: year };
}

async function getApplicableItemsForPeriod(
  structureId: string,
  tenantId: string,
  periodLabel: string,
  fallbackAmount = 0,
) {
  const items = await loadStructureItems(structureId, tenantId);
  if (items.length === 0) {
    return { periodLabel, totalAmount: fallbackAmount, items: [] };
  }
  const hasScheduledItems = items.some((item) => item.scheduleType !== 'monthly');
  if (!hasScheduledItems) {
    return {
      periodLabel,
      totalAmount: items.reduce((total, item) => total + item.amount, 0),
      items: items.map((item) => ({ ...item, isIncluded: true })),
    };
  }

  const { month, academicYear, calendarYear } = await resolvePeriodAcademicYear(
    tenantId,
    periodLabel,
    items.some((item) => item.academicYear !== null),
  );
  const previewItems = items.map((item) => {
    const yearMatches =
      !item.academicYear ||
      item.academicYear === academicYear ||
      item.academicYear === calendarYear;
    const isIncluded =
      item.scheduleType === 'monthly' ||
      (yearMatches && item.months.includes(month));
    return { ...item, isIncluded };
  });
  return {
    periodLabel,
    totalAmount: previewItems.reduce(
      (total, item) => total + (item.isIncluded ? item.amount : 0),
      0,
    ),
    items: previewItems,
  };
}

async function getStructureWithItems(structureId: string, tenantId: string) {
  const [row] = await db
    .select({
      id: feeStructures.id,
      name: feeStructures.name,
      classId: feeStructures.classId,
      className: classes.name,
      sectionId: feeStructures.sectionId,
      sectionName: sections.name,
      amount: feeStructures.amount,
      frequency: feeStructures.frequency,
      description: feeStructures.description,
      isActive: feeStructures.isActive,
      createdAt: feeStructures.createdAt,
      updatedAt: feeStructures.updatedAt,
    })
    .from(feeStructures)
    .leftJoin(classes, eq(feeStructures.classId, classes.id))
    .leftJoin(sections, eq(feeStructures.sectionId, sections.id))
    .where(
      and(
        eq(feeStructures.id, structureId),
        eq(feeStructures.tenantId, tenantId),
        isNull(feeStructures.deletedAt),
      ),
    )
    .limit(1);
  if (!row) throw new NotFoundError('Fee structure');
  return { ...row, items: await loadStructureItems(structureId, tenantId) };
}

export async function createFeeHead(input: CreateFeeHeadInput) {
  const [created] = await db
    .insert(feeHeads)
    .values({
      tenantId: input.tenantId,
      name: input.data.name.trim(),
      code: input.data.code.trim().toUpperCase(),
      type: input.data.type ?? 'monthly',
      description: input.data.description?.trim() || null,
      isMandatory: input.data.isMandatory ?? true,
    })
    .onConflictDoNothing({
      target: [feeHeads.tenantId, feeHeads.code],
      where: isNull(feeHeads.deletedAt),
    })
    .returning();

  if (!created) {
    throw new BadRequestError(`Fee head code "${input.data.code}" already exists`);
  }
  return created;
}

export async function updateFeeHead(input: UpdateFeeHeadInput) {
  const existing = await requireFeeHead(input.feeHeadId, input.tenantId);
  const code = input.data.code?.trim().toUpperCase();
  if (code && code !== existing.code) {
    const [conflict] = await db
      .select({ id: feeHeads.id })
      .from(feeHeads)
      .where(
        and(
          eq(feeHeads.tenantId, input.tenantId),
          eq(feeHeads.code, code),
          ne(feeHeads.id, existing.id),
          isNull(feeHeads.deletedAt),
        ),
      )
      .limit(1);
    if (conflict) {
      throw new BadRequestError(`Fee head code "${code}" already exists`);
    }
  }

  const [updated] = await db
    .update(feeHeads)
    .set({
      ...(input.data.name !== undefined ? { name: input.data.name.trim() } : {}),
      ...(code !== undefined ? { code } : {}),
      ...(input.data.type !== undefined ? { type: input.data.type } : {}),
      ...(input.data.description !== undefined
        ? { description: input.data.description?.trim() || null }
        : {}),
      ...(input.data.isMandatory !== undefined
        ? { isMandatory: input.data.isMandatory }
        : {}),
      ...(input.data.isActive !== undefined ? { isActive: input.data.isActive } : {}),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(feeHeads.id, existing.id),
        eq(feeHeads.tenantId, input.tenantId),
      ),
    )
    .returning();

  if (!updated) throw new NotFoundError('Fee head');
  return updated;
}

export async function deleteFeeHead(feeHeadId: string, tenantId: string) {
  const existing = await requireFeeHead(feeHeadId, tenantId);
  const [usage] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(feeStructureItems)
    .where(
      and(
        eq(feeStructureItems.feeHeadId, existing.id),
        eq(feeStructureItems.tenantId, tenantId),
      ),
    );

  if ((usage?.count ?? 0) > 0) {
    throw new BadRequestError(
      `Cannot delete fee head; it is used in ${usage?.count} fee structure(s)`,
    );
  }

  await db
    .update(feeHeads)
    .set({ deletedAt: new Date(), updatedAt: new Date(), isActive: false })
    .where(
      and(
        eq(feeHeads.id, existing.id),
        eq(feeHeads.tenantId, tenantId),
      ),
    );
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
      sectionId: feeStructures.sectionId,
      sectionName: sections.name,
      amount: feeStructures.amount,
      frequency: feeStructures.frequency,
      description: feeStructures.description,
      isActive: feeStructures.isActive,
      createdAt: feeStructures.createdAt,
      updatedAt: feeStructures.updatedAt,
    })
    .from(feeStructures)
    .leftJoin(classes, eq(feeStructures.classId, classes.id))
    .leftJoin(sections, eq(feeStructures.sectionId, sections.id))
    .where(and(...conditions))
    .orderBy(desc(feeStructures.createdAt));

  if (rows.length === 0) return [];
  const items = await db
    .select({
      id: feeStructureItems.id,
      structureId: feeStructureItems.structureId,
      feeHeadId: feeStructureItems.feeHeadId,
      feeHeadName: feeHeads.name,
      feeHeadCode: feeHeads.code,
      amount: feeStructureItems.amount,
      scheduleType: feeStructureItems.scheduleType,
    })
    .from(feeStructureItems)
    .innerJoin(
      feeHeads,
      and(
        eq(feeStructureItems.feeHeadId, feeHeads.id),
        eq(feeHeads.tenantId, filters.tenantId),
      ),
    )
    .where(
      and(
        eq(feeStructureItems.tenantId, filters.tenantId),
        inArray(feeStructureItems.structureId, rows.map((row) => row.id)),
      ),
    )
    .orderBy(feeHeads.name);
  const itemsWithSchedules = await addItemSchedules(items, filters.tenantId);
  const itemsByStructure = new Map<string, FeeStructureItemResponse[]>();
  for (const { structureId, ...item } of itemsWithSchedules) {
    const structureItems = itemsByStructure.get(structureId) ?? [];
    structureItems.push(item);
    itemsByStructure.set(structureId, structureItems);
  }
  return rows.map((row) => ({
    ...mapStructure(row),
    items: itemsByStructure.get(row.id) ?? [],
  }));
}

export async function createFeeStructure(input: CreateFeeStructureInput) {
  if (input.data.classId) {
    await requireClass(input.data.classId, input.tenantId);
  }
  if (input.data.sectionId) {
    if (!input.data.classId) {
      throw new BadRequestError('A class is required when assigning a section');
    }
    await requireSectionForClass(input.data.sectionId, input.data.classId, input.tenantId);
  }

  await validateFeeHeads(input.data.items.map((item) => item.feeHeadId), input.tenantId);
  const amount = input.data.items.reduce((total, item) => total + item.amount, 0);
  if (amount > MAX_STRUCTURE_AMOUNT) {
    throw new BadRequestError('The total fee amount is too large');
  }

  const structureId = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(feeStructures)
      .values({
        tenantId: input.tenantId,
        name: input.data.name.trim(),
        classId: input.data.classId ?? null,
        sectionId: input.data.sectionId ?? null,
        amount,
        frequency: input.data.frequency ?? 'monthly',
        description: input.data.description?.trim() || null,
      })
      .returning({ id: feeStructures.id });
    if (!created) throw new BadRequestError('Could not create fee structure');

    await saveStructureItems(tx, created.id, input.tenantId, input.data.items);
    return created.id;
  });
  return getStructureWithItems(structureId, input.tenantId);
}

export async function updateFeeStructure(input: UpdateFeeStructureInput) {
  const existing = await requireStructure(input.structureId, input.tenantId);
  if (input.data.classId) {
    await requireClass(input.data.classId, input.tenantId);
  }
  const classId = input.data.classId !== undefined ? input.data.classId : existing.classId;
  const sectionId =
    input.data.sectionId !== undefined ? input.data.sectionId : existing.sectionId;
  if (sectionId) {
    if (!classId) throw new BadRequestError('A class is required when assigning a section');
    await requireSectionForClass(sectionId, classId, input.tenantId);
  }

  if (input.data.items) {
    await validateFeeHeads(
      input.data.items.map((item) => item.feeHeadId),
      input.tenantId,
    );
  }
  const amount = input.data.items?.reduce((total, item) => total + item.amount, 0);
  if (amount !== undefined && amount > MAX_STRUCTURE_AMOUNT) {
    throw new BadRequestError('The total fee amount is too large');
  }

  await db.transaction(async (tx) => {
    await tx
      .update(feeStructures)
      .set({
        ...(input.data.name !== undefined ? { name: input.data.name.trim() } : {}),
        ...(input.data.classId !== undefined ? { classId: input.data.classId } : {}),
        ...(input.data.sectionId !== undefined ? { sectionId: input.data.sectionId } : {}),
        ...(amount !== undefined ? { amount } : {}),
        ...(input.data.frequency !== undefined ? { frequency: input.data.frequency } : {}),
        ...(input.data.description !== undefined
          ? { description: input.data.description?.trim() || null }
          : {}),
        ...(input.data.isActive !== undefined ? { isActive: input.data.isActive } : {}),
        updatedAt: new Date(),
      })
      .where(and(eq(feeStructures.id, existing.id), eq(feeStructures.tenantId, input.tenantId)));

    if (input.data.items) {
      await tx
        .delete(feeStructureItems)
        .where(
          and(
            eq(feeStructureItems.structureId, existing.id),
            eq(feeStructureItems.tenantId, input.tenantId),
          ),
        );
      await saveStructureItems(tx, existing.id, input.tenantId, input.data.items);
    }
  });
  return getStructureWithItems(existing.id, input.tenantId);
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
  const { tenantId, page = 1, limit = 20, search, status, studentId, classId, sectionId } = filters;
  const conditions = [eq(feeInvoices.tenantId, tenantId), isNull(feeInvoices.deletedAt)];
  if (status) conditions.push(eq(feeInvoices.status, status));
  if (studentId) conditions.push(eq(feeInvoices.studentId, studentId));
  if (classId) conditions.push(eq(students.classId, classId));
  if (sectionId) conditions.push(eq(students.sectionId, sectionId));
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
  const [items, payments] = await Promise.all([
    db
      .select({
        id: feeInvoiceItems.id,
        feeHeadId: feeInvoiceItems.feeHeadId,
        name: feeInvoiceItems.name,
        amount: feeInvoiceItems.amount,
      })
      .from(feeInvoiceItems)
      .where(
        and(
          eq(feeInvoiceItems.invoiceId, invoiceId),
          eq(feeInvoiceItems.tenantId, tenantId),
        ),
      )
      .orderBy(feeInvoiceItems.createdAt),
    db
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
      .orderBy(desc(feePayments.paidAt)),
  ]);

  return { ...invoice, items, payments };
}

export async function createInvoice(input: CreateInvoiceInput) {
  const student = await requireStudent(input.data.studentId, input.tenantId);
  let amount = input.data.amount;
  let title = input.data.title?.trim();
  const feeStructureId = input.data.feeStructureId ?? null;
  let lineItems: Array<{
    feeHeadId: string | null;
    name: string;
    amount: number;
  }> = [];

  if (feeStructureId) {
    const structure = await requireStructure(feeStructureId, input.tenantId);
    if (!structure.isActive) throw new BadRequestError('Fee structure is inactive');
    if (structure.classId && structure.classId !== student.classId) {
      throw new BadRequestError('Fee structure is assigned to a different class');
    }
    if (structure.sectionId && structure.sectionId !== student.sectionId) {
      throw new BadRequestError('Fee structure is assigned to a different section');
    }
    const preview = await getApplicableItemsForPeriod(
      structure.id,
      input.tenantId,
      input.data.periodLabel ?? '',
      structure.amount,
    );
    if (input.data.amount !== undefined && input.data.amount !== preview.totalAmount) {
      throw new BadRequestError('Invoice amount must match the selected fee structure and period');
    }
    amount = preview.totalAmount;
    title = title || structure.name;
    lineItems = preview.items
      .filter((item) => item.isIncluded)
      .map((item) => ({
        feeHeadId: item.feeHeadId,
        name: item.feeHeadName,
        amount: item.amount,
      }));
  }

  if (amount === undefined || amount <= 0) {
    throw new BadRequestError('Invoice amount is required');
  }
  if (!title) throw new BadRequestError('Invoice title is required');

  const issue = input.data.issue !== false;
  const invoiceId = await db.transaction(async (tx) => {
    const [created] = await tx
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
    if (lineItems.length > 0) {
      await tx.insert(feeInvoiceItems).values(
        lineItems.map((item) => ({
          tenantId: input.tenantId,
          invoiceId: created.id,
          feeHeadId: item.feeHeadId,
          name: item.name,
          amount: item.amount,
        })),
      );
    }
    return created.id;
  });

  return getInvoiceById(invoiceId, input.tenantId);
}

export async function generateInvoices(input: GenerateInvoicesInput) {
  const structure = await requireStructure(input.data.feeStructureId, input.tenantId);
  if (!structure.isActive) throw new BadRequestError('Fee structure is inactive');

  const classId = input.data.classId ?? structure.classId;
  if (!classId) {
    throw new BadRequestError('classId is required when the fee structure is not class-specific');
  }
  await requireClass(classId, input.tenantId);
  if (structure.classId && structure.classId !== classId) {
    throw new BadRequestError('Fee structure is assigned to a different class');
  }
  if (structure.sectionId && input.data.sectionId && structure.sectionId !== input.data.sectionId) {
    throw new BadRequestError('Fee structure is assigned to a different section');
  }
  const sectionId = structure.sectionId ?? input.data.sectionId;
  if (sectionId) await requireSectionForClass(sectionId, classId, input.tenantId);
  const preview = await getApplicableItemsForPeriod(
    structure.id,
    input.tenantId,
    input.data.periodLabel,
    structure.amount,
  );
  if (preview.totalAmount <= 0) {
    throw new BadRequestError(`No fee heads are scheduled for ${input.data.periodLabel}`);
  }
  const applicableItems = preview.items.filter((item) => item.isIncluded);

  const studentConditions = [
    eq(students.tenantId, input.tenantId),
    eq(students.classId, classId),
    eq(students.status, 'active'),
    isNull(students.deletedAt),
  ];
  if (sectionId) studentConditions.push(eq(students.sectionId, sectionId));

  const targetStudents = await db
    .select({ id: students.id })
    .from(students)
    .where(and(...studentConditions));

  if (targetStudents.length === 0) {
    throw new BadRequestError('No active students found for generation');
  }

  const periodLabel = input.data.periodLabel.trim();
  const title = `${structure.name} — ${periodLabel}`;
  const studentIds = targetStudents.map((student) => student.id);

  return db.transaction(async (tx) => {
    const existingInvoices = await tx
      .select({ studentId: feeInvoices.studentId })
      .from(feeInvoices)
      .where(
        and(
          eq(feeInvoices.tenantId, input.tenantId),
          eq(feeInvoices.feeStructureId, structure.id),
          eq(feeInvoices.periodLabel, periodLabel),
          isNull(feeInvoices.deletedAt),
          inArray(feeInvoices.studentId, studentIds),
        ),
      );
    const existingStudentIds = new Set(
      existingInvoices.map((invoice) => invoice.studentId),
    );
    const studentsToBill = targetStudents.filter(
      (student) => !existingStudentIds.has(student.id),
    );
    if (studentsToBill.length === 0) {
      return {
        createdCount: 0,
        skippedCount: targetStudents.length,
        invoiceIds: [],
      };
    }

    const createdInvoices = await tx
      .insert(feeInvoices)
      .values(
        studentsToBill.map((student) => ({
          tenantId: input.tenantId,
          studentId: student.id,
          feeStructureId: structure.id,
          title,
          periodLabel,
          amount: preview.totalAmount,
          amountPaid: 0,
          dueDate: input.data.dueDate,
          status: 'issued',
          notes: input.data.notes?.trim() || null,
          createdBy: input.createdBy,
        })),
      )
      .returning({ id: feeInvoices.id });

    if (applicableItems.length > 0 && createdInvoices.length > 0) {
      await tx.insert(feeInvoiceItems).values(
        createdInvoices.flatMap((invoice) =>
          applicableItems.map((item) => ({
            tenantId: input.tenantId,
            invoiceId: invoice.id,
            feeHeadId: item.feeHeadId,
            name: item.feeHeadName,
            amount: item.amount,
          })),
        ),
      );
    }

    return {
      createdCount: createdInvoices.length,
      skippedCount: existingStudentIds.size,
      invoiceIds: createdInvoices.map((invoice) => invoice.id),
    };
  });
}

export async function previewInvoice(input: PreviewInvoiceInput): Promise<FeeStructurePreview> {
  const structure = await requireStructure(input.structureId, input.tenantId);
  return getApplicableItemsForPeriod(
    structure.id,
    input.tenantId,
    input.periodLabel,
    structure.amount,
  );
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
