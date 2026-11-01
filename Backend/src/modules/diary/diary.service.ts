import { and, desc, eq, gte, ilike, isNull, lte, or, sql } from 'drizzle-orm';
import { db } from '../../config/database.js';
import { BadRequestError, NotFoundError } from '../../lib/errors.js';
import { users } from '../auth/auth.schema.js';
import { classes } from '../classes/classes.schema.js';
import { sections } from '../sections/sections.schema.js';
import { diaryEntries } from './diary.schema.js';
import type {
  CreateDiaryInput,
  ListDiaryFilters,
  UpdateDiaryInput,
} from './diary.types.js';

function mapEntry(row: {
  id: string;
  entryDate: string;
  classId: string;
  className: string | null;
  sectionId: string | null;
  sectionName: string | null;
  title: string;
  homework: string;
  classwork: string | null;
  remarks: string | null;
  status: string;
  publishedAt: Date | null;
  createdBy: string | null;
  createdByName: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: row.id,
    entryDate: row.entryDate,
    classId: row.classId,
    className: row.className,
    sectionId: row.sectionId,
    sectionName: row.sectionName,
    title: row.title,
    homework: row.homework,
    classwork: row.classwork,
    remarks: row.remarks,
    status: row.status,
    publishedAt: row.publishedAt,
    createdBy: row.createdBy,
    createdByName: row.createdByName,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function requireClass(classId: string, tenantId: string) {
  const [row] = await db
    .select({ id: classes.id })
    .from(classes)
    .where(
      and(eq(classes.id, classId), eq(classes.tenantId, tenantId), isNull(classes.deletedAt)),
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
  const [row] = await db
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
  if (!row) throw new NotFoundError('Section');
  return row;
}

async function requireEntry(entryId: string, tenantId: string) {
  const [entry] = await db
    .select()
    .from(diaryEntries)
    .where(
      and(
        eq(diaryEntries.id, entryId),
        eq(diaryEntries.tenantId, tenantId),
        isNull(diaryEntries.deletedAt),
      ),
    )
    .limit(1);
  if (!entry) throw new NotFoundError('Diary entry');
  return entry;
}

const selectFields = {
  id: diaryEntries.id,
  entryDate: diaryEntries.entryDate,
  classId: diaryEntries.classId,
  className: classes.name,
  sectionId: diaryEntries.sectionId,
  sectionName: sections.name,
  title: diaryEntries.title,
  homework: diaryEntries.homework,
  classwork: diaryEntries.classwork,
  remarks: diaryEntries.remarks,
  status: diaryEntries.status,
  publishedAt: diaryEntries.publishedAt,
  createdBy: diaryEntries.createdBy,
  createdByName: users.fullName,
  createdAt: diaryEntries.createdAt,
  updatedAt: diaryEntries.updatedAt,
};

export async function listDiaryEntries(filters: ListDiaryFilters) {
  const {
    tenantId,
    page = 1,
    limit = 20,
    search,
    status,
    classId,
    sectionId,
    entryDate,
    fromDate,
    toDate,
  } = filters;

  const conditions = [eq(diaryEntries.tenantId, tenantId), isNull(diaryEntries.deletedAt)];
  if (status) conditions.push(eq(diaryEntries.status, status));
  if (classId) conditions.push(eq(diaryEntries.classId, classId));
  if (sectionId) conditions.push(eq(diaryEntries.sectionId, sectionId));
  if (entryDate) conditions.push(eq(diaryEntries.entryDate, entryDate));
  if (fromDate) conditions.push(gte(diaryEntries.entryDate, fromDate));
  if (toDate) conditions.push(lte(diaryEntries.entryDate, toDate));
  if (search) {
    const escaped = `%${search.replace(/[\\%_]/g, '\\$&')}%`;
    const searchFilter = or(
      ilike(diaryEntries.title, escaped),
      ilike(diaryEntries.homework, escaped),
      ilike(diaryEntries.classwork, escaped),
    );
    if (searchFilter) conditions.push(searchFilter);
  }

  const where = and(...conditions);
  const offset = (page - 1) * limit;

  const [rows, countRows] = await Promise.all([
    db
      .select(selectFields)
      .from(diaryEntries)
      .leftJoin(classes, eq(diaryEntries.classId, classes.id))
      .leftJoin(sections, eq(diaryEntries.sectionId, sections.id))
      .leftJoin(users, eq(diaryEntries.createdBy, users.id))
      .where(where)
      .orderBy(desc(diaryEntries.entryDate), desc(diaryEntries.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(diaryEntries).where(where),
  ]);

  const total = countRows[0]?.count ?? 0;
  return {
    items: rows.map(mapEntry),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
}

export async function getDiaryEntryById(entryId: string, tenantId: string) {
  const [row] = await db
    .select(selectFields)
    .from(diaryEntries)
    .leftJoin(classes, eq(diaryEntries.classId, classes.id))
    .leftJoin(sections, eq(diaryEntries.sectionId, sections.id))
    .leftJoin(users, eq(diaryEntries.createdBy, users.id))
    .where(
      and(
        eq(diaryEntries.id, entryId),
        eq(diaryEntries.tenantId, tenantId),
        isNull(diaryEntries.deletedAt),
      ),
    )
    .limit(1);
  if (!row) throw new NotFoundError('Diary entry');
  return mapEntry(row);
}

export async function createDiaryEntry(input: CreateDiaryInput) {
  await requireClass(input.data.classId, input.tenantId);
  if (input.data.sectionId) {
    await requireSectionForClass(input.data.sectionId, input.data.classId, input.tenantId);
  }

  const now = new Date();
  const publish = input.data.publish === true;
  const [created] = await db
    .insert(diaryEntries)
    .values({
      tenantId: input.tenantId,
      entryDate: input.data.entryDate,
      classId: input.data.classId,
      sectionId: input.data.sectionId ?? null,
      title: input.data.title.trim(),
      homework: input.data.homework.trim(),
      classwork: input.data.classwork?.trim() || null,
      remarks: input.data.remarks?.trim() || null,
      status: publish ? 'published' : 'draft',
      publishedAt: publish ? now : null,
      createdBy: input.createdBy,
    })
    .returning({ id: diaryEntries.id });

  if (!created) throw new BadRequestError('Could not create diary entry');
  return getDiaryEntryById(created.id, input.tenantId);
}

export async function updateDiaryEntry(input: UpdateDiaryInput) {
  const existing = await requireEntry(input.entryId, input.tenantId);
  const nextClassId = input.data.classId ?? existing.classId;
  const nextSectionId =
    input.data.sectionId !== undefined ? input.data.sectionId : existing.sectionId;

  if (input.data.classId) {
    await requireClass(input.data.classId, input.tenantId);
  }
  if (nextSectionId) {
    await requireSectionForClass(nextSectionId, nextClassId, input.tenantId);
  }

  await db
    .update(diaryEntries)
    .set({
      ...(input.data.entryDate !== undefined ? { entryDate: input.data.entryDate } : {}),
      ...(input.data.classId !== undefined ? { classId: input.data.classId } : {}),
      ...(input.data.sectionId !== undefined ? { sectionId: input.data.sectionId } : {}),
      ...(input.data.title !== undefined ? { title: input.data.title.trim() } : {}),
      ...(input.data.homework !== undefined ? { homework: input.data.homework.trim() } : {}),
      ...(input.data.classwork !== undefined
        ? { classwork: input.data.classwork?.trim() || null }
        : {}),
      ...(input.data.remarks !== undefined
        ? { remarks: input.data.remarks?.trim() || null }
        : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(diaryEntries.id, existing.id), eq(diaryEntries.tenantId, input.tenantId)));

  return getDiaryEntryById(existing.id, input.tenantId);
}

export async function publishDiaryEntry(entryId: string, tenantId: string) {
  const existing = await requireEntry(entryId, tenantId);
  if (existing.status === 'published') {
    return getDiaryEntryById(existing.id, tenantId);
  }

  await db
    .update(diaryEntries)
    .set({
      status: 'published',
      publishedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(diaryEntries.id, existing.id), eq(diaryEntries.tenantId, tenantId)));

  return getDiaryEntryById(existing.id, tenantId);
}

export async function deleteDiaryEntry(entryId: string, tenantId: string) {
  const existing = await requireEntry(entryId, tenantId);
  await db
    .update(diaryEntries)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(diaryEntries.id, existing.id), eq(diaryEntries.tenantId, tenantId)));
}
