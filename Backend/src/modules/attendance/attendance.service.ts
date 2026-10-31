import { and, asc, eq, gte, inArray, isNull, lte, sql } from 'drizzle-orm';
import { db } from '../../config/database.js';
import { BadRequestError, NotFoundError } from '../../lib/errors.js';
import { classes } from '../classes/classes.schema.js';
import { sections } from '../sections/sections.schema.js';
import { students } from '../students/students.schema.js';
import { attendanceRecords } from './attendance.schema.js';
import type {
  GetSheetInput,
  SaveSheetInput,
  SummaryInput,
} from './attendance.types.js';

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
        isNull(classes.deletedAt),
      ),
    )
    .limit(1);
  if (!row) throw new NotFoundError('Section');
  return row;
}

export async function getAttendanceSheet(input: GetSheetInput) {
  const section = await requireSection(input.sectionId, input.tenantId);

  const studentRows = await db
    .select({
      id: students.id,
      fullName: students.fullName,
      admissionNo: students.admissionNo,
      gender: students.gender,
      status: students.status,
    })
    .from(students)
    .where(
      and(
        eq(students.tenantId, input.tenantId),
        eq(students.sectionId, input.sectionId),
        isNull(students.deletedAt),
        eq(students.status, 'active'),
      ),
    )
    .orderBy(asc(students.fullName));

  const existing = await db
    .select({
      id: attendanceRecords.id,
      studentId: attendanceRecords.studentId,
      status: attendanceRecords.status,
      notes: attendanceRecords.notes,
      markedBy: attendanceRecords.markedBy,
      updatedAt: attendanceRecords.updatedAt,
    })
    .from(attendanceRecords)
    .where(
      and(
        eq(attendanceRecords.tenantId, input.tenantId),
        eq(attendanceRecords.sectionId, input.sectionId),
        eq(attendanceRecords.date, input.date),
      ),
    );

  const byStudent = new Map(existing.map((row) => [row.studentId, row]));

  const records = studentRows.map((student) => {
    const mark = byStudent.get(student.id);
    return {
      studentId: student.id,
      fullName: student.fullName,
      admissionNo: student.admissionNo,
      gender: student.gender,
      status: mark?.status ?? null,
      notes: mark?.notes ?? null,
      recordId: mark?.id ?? null,
    };
  });

  const counts = {
    total: records.length,
    present: records.filter((r) => r.status === 'present').length,
    absent: records.filter((r) => r.status === 'absent').length,
    late: records.filter((r) => r.status === 'late').length,
    leave: records.filter((r) => r.status === 'leave').length,
    unmarked: records.filter((r) => r.status === null).length,
  };

  return {
    section: {
      id: section.id,
      name: section.name,
      fullName: section.fullName,
      classId: section.classId,
      className: section.className,
    },
    date: input.date,
    isMarked: existing.length > 0,
    counts,
    records,
  };
}

export async function saveAttendanceSheet(input: SaveSheetInput) {
  await requireSection(input.sectionId, input.tenantId);

  const studentIds = [...new Set(input.records.map((row) => row.studentId))];
  if (studentIds.length !== input.records.length) {
    throw new BadRequestError('Duplicate student IDs in attendance payload');
  }

  const validStudents = await db
    .select({ id: students.id })
    .from(students)
    .where(
      and(
        eq(students.tenantId, input.tenantId),
        eq(students.sectionId, input.sectionId),
        isNull(students.deletedAt),
        eq(students.status, 'active'),
        inArray(students.id, studentIds),
      ),
    );

  if (validStudents.length !== studentIds.length) {
    throw new BadRequestError('Some students are not active members of this section');
  }

  const now = new Date();

  await db.transaction(async (tx) => {
    for (const record of input.records) {
      const [existing] = await tx
        .select({ id: attendanceRecords.id })
        .from(attendanceRecords)
        .where(
          and(
            eq(attendanceRecords.tenantId, input.tenantId),
            eq(attendanceRecords.studentId, record.studentId),
            eq(attendanceRecords.date, input.date),
          ),
        )
        .limit(1);

      if (existing) {
        await tx
          .update(attendanceRecords)
          .set({
            sectionId: input.sectionId,
            status: record.status,
            notes: record.notes ?? null,
            markedBy: input.markedBy,
            updatedAt: now,
          })
          .where(eq(attendanceRecords.id, existing.id));
      } else {
        await tx.insert(attendanceRecords).values({
          tenantId: input.tenantId,
          sectionId: input.sectionId,
          studentId: record.studentId,
          date: input.date,
          status: record.status,
          notes: record.notes ?? null,
          markedBy: input.markedBy,
        });
      }
    }
  });

  return getAttendanceSheet({
    tenantId: input.tenantId,
    sectionId: input.sectionId,
    date: input.date,
  });
}

export async function getAttendanceSummary(input: SummaryInput) {
  if (input.from > input.to) {
    throw new BadRequestError('"from" date must be on or before "to" date');
  }

  await requireSection(input.sectionId, input.tenantId);

  const [row] = await db
    .select({
      present: sql<number>`count(*) filter (where ${attendanceRecords.status} = 'present')::int`,
      absent: sql<number>`count(*) filter (where ${attendanceRecords.status} = 'absent')::int`,
      late: sql<number>`count(*) filter (where ${attendanceRecords.status} = 'late')::int`,
      leave: sql<number>`count(*) filter (where ${attendanceRecords.status} = 'leave')::int`,
      total: sql<number>`count(*)::int`,
    })
    .from(attendanceRecords)
    .where(
      and(
        eq(attendanceRecords.tenantId, input.tenantId),
        eq(attendanceRecords.sectionId, input.sectionId),
        gte(attendanceRecords.date, input.from),
        lte(attendanceRecords.date, input.to),
      ),
    );

  return {
    sectionId: input.sectionId,
    from: input.from,
    to: input.to,
    present: Number(row?.present ?? 0),
    absent: Number(row?.absent ?? 0),
    late: Number(row?.late ?? 0),
    leave: Number(row?.leave ?? 0),
    total: Number(row?.total ?? 0),
  };
}
