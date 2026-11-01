import { and, desc, eq, gte, inArray, isNull, lte, or, sql } from 'drizzle-orm';
import { db } from '../../config/database.js';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../lib/errors.js';
import { attendanceRecords } from '../attendance/attendance.schema.js';
import { classes } from '../classes/classes.schema.js';
import { diaryEntries } from '../diary/diary.schema.js';
import { exams } from '../exams/exams.schema.js';
import * as examsService from '../exams/exams.service.js';
import * as feesService from '../fees/fees.service.js';
import { notices } from '../notices/notices.schema.js';
import { sections } from '../sections/sections.schema.js';
import { students } from '../students/students.schema.js';
import { users } from '../auth/auth.schema.js';
import {
  assertParentOwnsStudent,
  listChildrenForParent,
} from './parents.service.js';

async function requireLinkedStudent(
  parentUserId: string,
  studentId: string,
  tenantId: string,
) {
  await assertParentOwnsStudent(parentUserId, studentId, tenantId);
  const [student] = await db
    .select({
      id: students.id,
      fullName: students.fullName,
      admissionNo: students.admissionNo,
      classId: students.classId,
      sectionId: students.sectionId,
      className: classes.name,
      sectionName: sections.name,
      status: students.status,
    })
    .from(students)
    .innerJoin(classes, eq(students.classId, classes.id))
    .innerJoin(sections, eq(students.sectionId, sections.id))
    .where(
      and(
        eq(students.id, studentId),
        eq(students.tenantId, tenantId),
        isNull(students.deletedAt),
      ),
    )
    .limit(1);
  if (!student) throw new NotFoundError('Student');
  return student;
}

export async function getPortalHome(parentUserId: string, tenantId: string) {
  const children = await listChildrenForParent(parentUserId, tenantId);
  return { children };
}

export async function getChildAttendance(input: {
  parentUserId: string;
  tenantId: string;
  studentId: string;
  from?: string;
  to?: string;
}) {
  const student = await requireLinkedStudent(
    input.parentUserId,
    input.studentId,
    input.tenantId,
  );

  const to = input.to ?? new Date().toISOString().slice(0, 10);
  const fromDefault = new Date();
  fromDefault.setDate(fromDefault.getDate() - 30);
  const from = input.from ?? fromDefault.toISOString().slice(0, 10);
  if (from > to) throw new BadRequestError('"from" must be on or before "to"');

  const rows = await db
    .select({
      id: attendanceRecords.id,
      date: attendanceRecords.date,
      status: attendanceRecords.status,
      notes: attendanceRecords.notes,
    })
    .from(attendanceRecords)
    .where(
      and(
        eq(attendanceRecords.tenantId, input.tenantId),
        eq(attendanceRecords.studentId, student.id),
        gte(attendanceRecords.date, from),
        lte(attendanceRecords.date, to),
      ),
    )
    .orderBy(desc(attendanceRecords.date));

  const summary = {
    present: rows.filter((row) => row.status === 'present').length,
    absent: rows.filter((row) => row.status === 'absent').length,
    late: rows.filter((row) => row.status === 'late').length,
    excused: rows.filter((row) => row.status === 'excused').length,
    total: rows.length,
  };

  return { student, from, to, summary, records: rows };
}

export async function getChildFees(input: {
  parentUserId: string;
  tenantId: string;
  studentId: string;
  page?: number;
  limit?: number;
}) {
  await requireLinkedStudent(input.parentUserId, input.studentId, input.tenantId);
  return feesService.listInvoices({
    tenantId: input.tenantId,
    studentId: input.studentId,
    page: input.page ?? 1,
    limit: input.limit ?? 20,
  });
}

export async function getChildDiary(input: {
  parentUserId: string;
  tenantId: string;
  studentId: string;
  page?: number;
  limit?: number;
}) {
  const student = await requireLinkedStudent(
    input.parentUserId,
    input.studentId,
    input.tenantId,
  );

  const page = input.page ?? 1;
  const limit = input.limit ?? 20;
  const offset = (page - 1) * limit;
  const where = and(
    eq(diaryEntries.tenantId, input.tenantId),
    eq(diaryEntries.status, 'published'),
    isNull(diaryEntries.deletedAt),
    or(
      eq(diaryEntries.sectionId, student.sectionId),
      and(
        eq(diaryEntries.classId, student.classId),
        isNull(diaryEntries.sectionId),
      ),
    ),
  );

  const [rows, countRows] = await Promise.all([
    db
      .select({
        id: diaryEntries.id,
        title: diaryEntries.title,
        entryDate: diaryEntries.entryDate,
        classwork: diaryEntries.classwork,
        homework: diaryEntries.homework,
        remarks: diaryEntries.remarks,
        publishedAt: diaryEntries.publishedAt,
        className: classes.name,
        sectionName: sections.name,
      })
      .from(diaryEntries)
      .leftJoin(classes, eq(diaryEntries.classId, classes.id))
      .leftJoin(sections, eq(diaryEntries.sectionId, sections.id))
      .where(where)
      .orderBy(desc(diaryEntries.entryDate), desc(diaryEntries.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(diaryEntries).where(where),
  ]);

  const total = countRows[0]?.count ?? 0;
  return {
    student,
    items: rows,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
}

export async function listParentNotices(input: {
  tenantId: string;
  page?: number;
  limit?: number;
}) {
  const page = input.page ?? 1;
  const limit = input.limit ?? 20;
  const offset = (page - 1) * limit;
  const where = and(
    eq(notices.tenantId, input.tenantId),
    eq(notices.status, 'published'),
    isNull(notices.deletedAt),
    inArray(notices.audience, ['all', 'parents']),
  );

  const [rows, countRows] = await Promise.all([
    db
      .select({
        id: notices.id,
        title: notices.title,
        body: notices.body,
        audience: notices.audience,
        publishedAt: notices.publishedAt,
        createdByName: users.fullName,
      })
      .from(notices)
      .leftJoin(users, eq(notices.createdBy, users.id))
      .where(where)
      .orderBy(desc(notices.publishedAt), desc(notices.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(notices).where(where),
  ]);

  const total = countRows[0]?.count ?? 0;
  return {
    items: rows,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
}

export async function getChildResults(input: {
  parentUserId: string;
  tenantId: string;
  studentId: string;
}) {
  const student = await requireLinkedStudent(
    input.parentUserId,
    input.studentId,
    input.tenantId,
  );

  const publishedExams = await db
    .select({
      id: exams.id,
      name: exams.name,
      term: exams.term,
      academicYear: exams.academicYear,
      startDate: exams.startDate,
      endDate: exams.endDate,
      publishedAt: exams.publishedAt,
      classId: exams.classId,
    })
    .from(exams)
    .where(
      and(
        eq(exams.tenantId, input.tenantId),
        eq(exams.classId, student.classId),
        eq(exams.status, 'published'),
        isNull(exams.deletedAt),
      ),
    )
    .orderBy(desc(exams.publishedAt));

  const results = [];
  for (const exam of publishedExams) {
    try {
      const card = await examsService.getStudentReportCard(
        exam.id,
        student.id,
        input.tenantId,
      );
      results.push({
        exam: {
          id: exam.id,
          name: exam.name,
          term: exam.term,
          academicYear: exam.academicYear,
          startDate: exam.startDate,
          endDate: exam.endDate,
          publishedAt: exam.publishedAt,
        },
        card: card.card,
      });
    } catch {
      // Student may not be in exam cohort — skip.
    }
  }

  return { student, results };
}

export async function requireParentActor(user: {
  id: string;
  role: string;
  tenantId: string | null;
}) {
  if (user.role !== 'parent') {
    throw new ForbiddenError('Parent portal access only');
  }
  if (!user.tenantId) throw new BadRequestError('A school account is required');
  return { userId: user.id, tenantId: user.tenantId };
}
