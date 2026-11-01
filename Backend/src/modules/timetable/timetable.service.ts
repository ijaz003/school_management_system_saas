import { and, asc, eq, isNull } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from '../../config/database.js';
import { BadRequestError, NotFoundError } from '../../lib/errors.js';
import { users } from '../auth/auth.schema.js';
import { classes } from '../classes/classes.schema.js';
import { sections } from '../sections/sections.schema.js';
import { subjects } from '../subjects/subjects.schema.js';
import { timetableEntries, timetablePeriods } from './timetable.schema.js';
import type {
  CreateTimetablePeriodData,
  UpdateTimetableEntryData,
  UpdateTimetablePeriodData,
  UpsertTimetableEntryData,
} from './timetable.types.js';
import { DEFAULT_TIMETABLE_PERIODS } from './timetable.types.js';

const teachers = alias(users, 'timetable_teachers');

function assertTimeOrder(startTime: string, endTime: string) {
  if (startTime >= endTime) {
    throw new BadRequestError('End time must be after start time');
  }
}

async function requirePeriod(periodId: string, tenantId: string) {
  const [row] = await db
    .select()
    .from(timetablePeriods)
    .where(
      and(
        eq(timetablePeriods.id, periodId),
        eq(timetablePeriods.tenantId, tenantId),
        isNull(timetablePeriods.deletedAt),
      ),
    )
    .limit(1);
  if (!row) throw new NotFoundError('Timetable period');
  return row;
}

async function requireSection(sectionId: string, tenantId: string) {
  const [row] = await db
    .select({
      id: sections.id,
      name: sections.name,
      fullName: sections.fullName,
      classId: sections.classId,
      className: classes.name,
    })
    .from(sections)
    .innerJoin(classes, eq(sections.classId, classes.id))
    .where(
      and(
        eq(sections.id, sectionId),
        eq(sections.tenantId, tenantId),
        isNull(sections.deletedAt),
      ),
    )
    .limit(1);
  if (!row) throw new NotFoundError('Section');
  return row;
}

async function requireSubject(subjectId: string, tenantId: string) {
  const [row] = await db
    .select({ id: subjects.id })
    .from(subjects)
    .where(
      and(
        eq(subjects.id, subjectId),
        eq(subjects.tenantId, tenantId),
        isNull(subjects.deletedAt),
      ),
    )
    .limit(1);
  if (!row) throw new NotFoundError('Subject');
  return row;
}

async function requireTeacher(teacherId: string, tenantId: string) {
  const [row] = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        eq(users.id, teacherId),
        eq(users.tenantId, tenantId),
        isNull(users.deletedAt),
      ),
    )
    .limit(1);
  if (!row) throw new NotFoundError('Teacher');
  return row;
}

function mapPeriod(row: {
  id: string;
  name: string;
  sortOrder: number;
  startTime: string;
  endTime: string;
  isBreak: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: row.id,
    name: row.name,
    sortOrder: row.sortOrder,
    startTime: row.startTime,
    endTime: row.endTime,
    isBreak: row.isBreak,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapEntry(row: {
  id: string;
  sectionId: string;
  periodId: string;
  dayOfWeek: number;
  subjectId: string | null;
  subjectName: string | null;
  subjectCode: string | null;
  teacherId: string | null;
  teacherName: string | null;
  room: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: row.id,
    sectionId: row.sectionId,
    periodId: row.periodId,
    dayOfWeek: row.dayOfWeek,
    subjectId: row.subjectId,
    subjectName: row.subjectName,
    subjectCode: row.subjectCode,
    teacherId: row.teacherId,
    teacherName: row.teacherName,
    room: row.room,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function ensureDefaultPeriods(tenantId: string) {
  const existing = await db
    .select({ id: timetablePeriods.id })
    .from(timetablePeriods)
    .where(
      and(eq(timetablePeriods.tenantId, tenantId), isNull(timetablePeriods.deletedAt)),
    )
    .limit(1);

  if (existing.length > 0) return;

  await db.insert(timetablePeriods).values(
    DEFAULT_TIMETABLE_PERIODS.map((period) => ({
      tenantId,
      name: period.name,
      sortOrder: period.sortOrder,
      startTime: period.startTime,
      endTime: period.endTime,
      isBreak: period.isBreak,
    })),
  );
}

export async function listPeriods(tenantId: string) {
  await ensureDefaultPeriods(tenantId);

  const rows = await db
    .select({
      id: timetablePeriods.id,
      name: timetablePeriods.name,
      sortOrder: timetablePeriods.sortOrder,
      startTime: timetablePeriods.startTime,
      endTime: timetablePeriods.endTime,
      isBreak: timetablePeriods.isBreak,
      createdAt: timetablePeriods.createdAt,
      updatedAt: timetablePeriods.updatedAt,
    })
    .from(timetablePeriods)
    .where(
      and(eq(timetablePeriods.tenantId, tenantId), isNull(timetablePeriods.deletedAt)),
    )
    .orderBy(asc(timetablePeriods.sortOrder), asc(timetablePeriods.startTime));

  return rows.map(mapPeriod);
}

export async function createPeriod(input: {
  tenantId: string;
  data: CreateTimetablePeriodData;
}) {
  await ensureDefaultPeriods(input.tenantId);
  assertTimeOrder(input.data.startTime, input.data.endTime);

  const sortOrder =
    input.data.sortOrder ??
    ((
      await db
        .select({ sortOrder: timetablePeriods.sortOrder })
        .from(timetablePeriods)
        .where(
          and(
            eq(timetablePeriods.tenantId, input.tenantId),
            isNull(timetablePeriods.deletedAt),
          ),
        )
        .orderBy(asc(timetablePeriods.sortOrder))
    ).at(-1)?.sortOrder ?? 0) + 1;

  const [row] = await db
    .insert(timetablePeriods)
    .values({
      tenantId: input.tenantId,
      name: input.data.name.trim(),
      sortOrder,
      startTime: input.data.startTime,
      endTime: input.data.endTime,
      isBreak: input.data.isBreak ?? false,
    })
    .returning();

  if (!row) throw new BadRequestError('Could not create period');
  return mapPeriod(row);
}

export async function updatePeriod(input: {
  periodId: string;
  tenantId: string;
  data: UpdateTimetablePeriodData;
}) {
  const period = await requirePeriod(input.periodId, input.tenantId);
  const startTime = input.data.startTime ?? period.startTime;
  const endTime = input.data.endTime ?? period.endTime;
  assertTimeOrder(startTime, endTime);

  const [row] = await db
    .update(timetablePeriods)
    .set({
      ...(input.data.name !== undefined ? { name: input.data.name.trim() } : {}),
      ...(input.data.sortOrder !== undefined ? { sortOrder: input.data.sortOrder } : {}),
      ...(input.data.startTime !== undefined ? { startTime: input.data.startTime } : {}),
      ...(input.data.endTime !== undefined ? { endTime: input.data.endTime } : {}),
      ...(input.data.isBreak !== undefined ? { isBreak: input.data.isBreak } : {}),
      updatedAt: new Date(),
    })
    .where(eq(timetablePeriods.id, period.id))
    .returning();

  if (!row) throw new NotFoundError('Timetable period');
  return mapPeriod(row);
}

export async function deletePeriod(periodId: string, tenantId: string) {
  const period = await requirePeriod(periodId, tenantId);
  const now = new Date();

  await db
    .update(timetableEntries)
    .set({ deletedAt: now, updatedAt: now })
    .where(
      and(
        eq(timetableEntries.periodId, period.id),
        eq(timetableEntries.tenantId, tenantId),
        isNull(timetableEntries.deletedAt),
      ),
    );

  await db
    .update(timetablePeriods)
    .set({ deletedAt: now, updatedAt: now })
    .where(eq(timetablePeriods.id, period.id));
}

export async function getSectionTimetable(sectionId: string, tenantId: string) {
  const section = await requireSection(sectionId, tenantId);
  const periods = await listPeriods(tenantId);

  const entries = await db
    .select({
      id: timetableEntries.id,
      sectionId: timetableEntries.sectionId,
      periodId: timetableEntries.periodId,
      dayOfWeek: timetableEntries.dayOfWeek,
      subjectId: timetableEntries.subjectId,
      subjectName: subjects.name,
      subjectCode: subjects.code,
      teacherId: timetableEntries.teacherId,
      teacherName: teachers.fullName,
      room: timetableEntries.room,
      createdAt: timetableEntries.createdAt,
      updatedAt: timetableEntries.updatedAt,
    })
    .from(timetableEntries)
    .leftJoin(subjects, eq(timetableEntries.subjectId, subjects.id))
    .leftJoin(teachers, eq(timetableEntries.teacherId, teachers.id))
    .where(
      and(
        eq(timetableEntries.tenantId, tenantId),
        eq(timetableEntries.sectionId, sectionId),
        isNull(timetableEntries.deletedAt),
      ),
    );

  return {
    section: {
      id: section.id,
      name: section.name,
      fullName: section.fullName,
      classId: section.classId,
      className: section.className,
    },
    periods,
    entries: entries.map(mapEntry),
  };
}

async function getEntryById(entryId: string, tenantId: string) {
  const [row] = await db
    .select({
      id: timetableEntries.id,
      sectionId: timetableEntries.sectionId,
      periodId: timetableEntries.periodId,
      dayOfWeek: timetableEntries.dayOfWeek,
      subjectId: timetableEntries.subjectId,
      subjectName: subjects.name,
      subjectCode: subjects.code,
      teacherId: timetableEntries.teacherId,
      teacherName: teachers.fullName,
      room: timetableEntries.room,
      createdAt: timetableEntries.createdAt,
      updatedAt: timetableEntries.updatedAt,
    })
    .from(timetableEntries)
    .leftJoin(subjects, eq(timetableEntries.subjectId, subjects.id))
    .leftJoin(teachers, eq(timetableEntries.teacherId, teachers.id))
    .where(
      and(
        eq(timetableEntries.id, entryId),
        eq(timetableEntries.tenantId, tenantId),
        isNull(timetableEntries.deletedAt),
      ),
    )
    .limit(1);

  if (!row) throw new NotFoundError('Timetable entry');
  return mapEntry(row);
}

export async function upsertEntry(input: {
  tenantId: string;
  data: UpsertTimetableEntryData;
}) {
  await requireSection(input.data.sectionId, input.tenantId);
  const period = await requirePeriod(input.data.periodId, input.tenantId);

  if (period.isBreak) {
    throw new BadRequestError('Cannot assign a subject to a break period');
  }

  if (input.data.subjectId) {
    await requireSubject(input.data.subjectId, input.tenantId);
  }
  if (input.data.teacherId) {
    await requireTeacher(input.data.teacherId, input.tenantId);
  }

  const hasContent =
    Boolean(input.data.subjectId) ||
    Boolean(input.data.teacherId) ||
    Boolean(input.data.room?.trim());

  const [existing] = await db
    .select({ id: timetableEntries.id })
    .from(timetableEntries)
    .where(
      and(
        eq(timetableEntries.tenantId, input.tenantId),
        eq(timetableEntries.sectionId, input.data.sectionId),
        eq(timetableEntries.periodId, input.data.periodId),
        eq(timetableEntries.dayOfWeek, input.data.dayOfWeek),
        isNull(timetableEntries.deletedAt),
      ),
    )
    .limit(1);

  if (!hasContent) {
    if (existing) {
      const now = new Date();
      await db
        .update(timetableEntries)
        .set({ deletedAt: now, updatedAt: now })
        .where(eq(timetableEntries.id, existing.id));
    }
    return null;
  }

  if (existing) {
    await db
      .update(timetableEntries)
      .set({
        subjectId: input.data.subjectId ?? null,
        teacherId: input.data.teacherId ?? null,
        room: input.data.room?.trim() || null,
        updatedAt: new Date(),
      })
      .where(eq(timetableEntries.id, existing.id));
    return getEntryById(existing.id, input.tenantId);
  }

  const [created] = await db
    .insert(timetableEntries)
    .values({
      tenantId: input.tenantId,
      sectionId: input.data.sectionId,
      periodId: input.data.periodId,
      dayOfWeek: input.data.dayOfWeek,
      subjectId: input.data.subjectId ?? null,
      teacherId: input.data.teacherId ?? null,
      room: input.data.room?.trim() || null,
    })
    .returning({ id: timetableEntries.id });

  if (!created) throw new BadRequestError('Could not save timetable entry');
  return getEntryById(created.id, input.tenantId);
}

export async function updateEntry(input: {
  entryId: string;
  tenantId: string;
  data: UpdateTimetableEntryData;
}) {
  const entry = await getEntryById(input.entryId, input.tenantId);

  if (input.data.subjectId) {
    await requireSubject(input.data.subjectId, input.tenantId);
  }
  if (input.data.teacherId) {
    await requireTeacher(input.data.teacherId, input.tenantId);
  }

  await db
    .update(timetableEntries)
    .set({
      ...(input.data.subjectId !== undefined ? { subjectId: input.data.subjectId } : {}),
      ...(input.data.teacherId !== undefined ? { teacherId: input.data.teacherId } : {}),
      ...(input.data.room !== undefined
        ? { room: input.data.room?.trim() || null }
        : {}),
      updatedAt: new Date(),
    })
    .where(eq(timetableEntries.id, entry.id));

  return getEntryById(entry.id, input.tenantId);
}

export async function deleteEntry(entryId: string, tenantId: string) {
  const entry = await getEntryById(entryId, tenantId);
  const now = new Date();
  await db
    .update(timetableEntries)
    .set({ deletedAt: now, updatedAt: now })
    .where(eq(timetableEntries.id, entry.id));
}
