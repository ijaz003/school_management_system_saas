import { and, asc, desc, eq, gte, inArray, isNull, lte, sql } from 'drizzle-orm';
import { db } from '../../config/database.js';
import { BadRequestError, NotFoundError } from '../../lib/errors.js';
import { attendanceRecords } from '../attendance/attendance.schema.js';
import { classes } from '../classes/classes.schema.js';
import { exams, examMarks, examSubjects } from '../exams/exams.schema.js';
import { feeInvoices, feePayments } from '../fees/fees.schema.js';
import { sections } from '../sections/sections.schema.js';
import { students } from '../students/students.schema.js';
import { subjects } from '../subjects/subjects.schema.js';

function monthStart() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    .toISOString()
    .slice(0, 10);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export async function getFeesReport(input: {
  tenantId: string;
  from?: string;
  to?: string;
  classId?: string;
  status?: string;
}) {
  const from = input.from ?? monthStart();
  const to = input.to ?? today();
  if (from > to) throw new BadRequestError('"from" must be on or before "to"');

  const invoiceConditions = [
    eq(feeInvoices.tenantId, input.tenantId),
    isNull(feeInvoices.deletedAt),
    gte(feeInvoices.dueDate, from),
    lte(feeInvoices.dueDate, to),
  ];
  if (input.status) invoiceConditions.push(eq(feeInvoices.status, input.status));
  if (input.classId) invoiceConditions.push(eq(students.classId, input.classId));

  const invoiceWhere = and(...invoiceConditions);

  const [summaryRows, byStatus, byClass, recent] = await Promise.all([
    db
      .select({
        invoiceCount: sql<number>`count(*)::int`,
        billed: sql<number>`coalesce(sum(${feeInvoices.amount}), 0)::int`,
        collected: sql<number>`coalesce(sum(${feeInvoices.amountPaid}), 0)::int`,
        outstanding: sql<number>`coalesce(sum(${feeInvoices.amount} - ${feeInvoices.amountPaid}), 0)::int`,
      })
      .from(feeInvoices)
      .innerJoin(students, eq(feeInvoices.studentId, students.id))
      .where(invoiceWhere),
    db
      .select({
        status: feeInvoices.status,
        count: sql<number>`count(*)::int`,
        amount: sql<number>`coalesce(sum(${feeInvoices.amount}), 0)::int`,
        paid: sql<number>`coalesce(sum(${feeInvoices.amountPaid}), 0)::int`,
      })
      .from(feeInvoices)
      .innerJoin(students, eq(feeInvoices.studentId, students.id))
      .where(invoiceWhere)
      .groupBy(feeInvoices.status),
    db
      .select({
        classId: classes.id,
        className: classes.name,
        count: sql<number>`count(*)::int`,
        billed: sql<number>`coalesce(sum(${feeInvoices.amount}), 0)::int`,
        collected: sql<number>`coalesce(sum(${feeInvoices.amountPaid}), 0)::int`,
        outstanding: sql<number>`coalesce(sum(${feeInvoices.amount} - ${feeInvoices.amountPaid}), 0)::int`,
      })
      .from(feeInvoices)
      .innerJoin(students, eq(feeInvoices.studentId, students.id))
      .innerJoin(classes, eq(students.classId, classes.id))
      .where(invoiceWhere)
      .groupBy(classes.id, classes.name)
      .orderBy(asc(classes.name)),
    db
      .select({
        id: feeInvoices.id,
        title: feeInvoices.title,
        studentName: students.fullName,
        admissionNo: students.admissionNo,
        className: classes.name,
        amount: feeInvoices.amount,
        amountPaid: feeInvoices.amountPaid,
        status: feeInvoices.status,
        dueDate: feeInvoices.dueDate,
      })
      .from(feeInvoices)
      .innerJoin(students, eq(feeInvoices.studentId, students.id))
      .leftJoin(classes, eq(students.classId, classes.id))
      .where(invoiceWhere)
      .orderBy(desc(feeInvoices.dueDate))
      .limit(50),
  ]);

  const paymentsCollected = await db
    .select({
      amount: sql<number>`coalesce(sum(${feePayments.amount}), 0)::int`,
      count: sql<number>`count(*)::int`,
    })
    .from(feePayments)
    .innerJoin(feeInvoices, eq(feePayments.invoiceId, feeInvoices.id))
    .innerJoin(students, eq(feeInvoices.studentId, students.id))
    .where(
      and(
        eq(feePayments.tenantId, input.tenantId),
        isNull(feePayments.deletedAt),
        gte(sql`(${feePayments.paidAt})::date`, from),
        lte(sql`(${feePayments.paidAt})::date`, to),
        ...(input.classId ? [eq(students.classId, input.classId)] : []),
      ),
    );

  const summary = summaryRows[0];
  return {
    filters: { from, to, classId: input.classId ?? null, status: input.status ?? null },
    summary: {
      invoiceCount: Number(summary?.invoiceCount ?? 0),
      billed: Number(summary?.billed ?? 0),
      collectedOnInvoices: Number(summary?.collected ?? 0),
      outstanding: Number(summary?.outstanding ?? 0),
      paymentsInRange: Number(paymentsCollected[0]?.amount ?? 0),
      paymentCount: Number(paymentsCollected[0]?.count ?? 0),
    },
    byStatus: byStatus.map((row) => ({
      status: row.status,
      count: Number(row.count),
      amount: Number(row.amount),
      paid: Number(row.paid),
    })),
    byClass: byClass.map((row) => ({
      classId: row.classId,
      className: row.className,
      count: Number(row.count),
      billed: Number(row.billed),
      collected: Number(row.collected),
      outstanding: Number(row.outstanding),
    })),
    invoices: recent.map((row) => ({
      ...row,
      balance: Math.max(0, row.amount - row.amountPaid),
    })),
  };
}

export async function getAttendanceReport(input: {
  tenantId: string;
  from: string;
  to: string;
  classId?: string;
  sectionId?: string;
}) {
  if (input.from > input.to) {
    throw new BadRequestError('"from" must be on or before "to"');
  }

  const conditions = [
    eq(attendanceRecords.tenantId, input.tenantId),
    gte(attendanceRecords.date, input.from),
    lte(attendanceRecords.date, input.to),
  ];
  if (input.sectionId) conditions.push(eq(attendanceRecords.sectionId, input.sectionId));
  if (input.classId) conditions.push(eq(sections.classId, input.classId));

  const where = and(...conditions);

  const [summaryRows, bySection, byDay] = await Promise.all([
    db
      .select({
        present: sql<number>`count(*) filter (where ${attendanceRecords.status} = 'present')::int`,
        absent: sql<number>`count(*) filter (where ${attendanceRecords.status} = 'absent')::int`,
        late: sql<number>`count(*) filter (where ${attendanceRecords.status} = 'late')::int`,
        leave: sql<number>`count(*) filter (where ${attendanceRecords.status} = 'leave')::int`,
        total: sql<number>`count(*)::int`,
      })
      .from(attendanceRecords)
      .innerJoin(sections, eq(attendanceRecords.sectionId, sections.id))
      .where(where),
    db
      .select({
        sectionId: sections.id,
        sectionName: sections.name,
        className: classes.name,
        present: sql<number>`count(*) filter (where ${attendanceRecords.status} = 'present')::int`,
        absent: sql<number>`count(*) filter (where ${attendanceRecords.status} = 'absent')::int`,
        late: sql<number>`count(*) filter (where ${attendanceRecords.status} = 'late')::int`,
        leave: sql<number>`count(*) filter (where ${attendanceRecords.status} = 'leave')::int`,
        total: sql<number>`count(*)::int`,
      })
      .from(attendanceRecords)
      .innerJoin(sections, eq(attendanceRecords.sectionId, sections.id))
      .innerJoin(classes, eq(sections.classId, classes.id))
      .where(where)
      .groupBy(sections.id, sections.name, classes.name)
      .orderBy(asc(classes.name), asc(sections.name)),
    db
      .select({
        date: attendanceRecords.date,
        present: sql<number>`count(*) filter (where ${attendanceRecords.status} = 'present')::int`,
        absent: sql<number>`count(*) filter (where ${attendanceRecords.status} = 'absent')::int`,
        late: sql<number>`count(*) filter (where ${attendanceRecords.status} = 'late')::int`,
        leave: sql<number>`count(*) filter (where ${attendanceRecords.status} = 'leave')::int`,
        total: sql<number>`count(*)::int`,
      })
      .from(attendanceRecords)
      .innerJoin(sections, eq(attendanceRecords.sectionId, sections.id))
      .where(where)
      .groupBy(attendanceRecords.date)
      .orderBy(asc(attendanceRecords.date)),
  ]);

  const summary = summaryRows[0];
  const total = Number(summary?.total ?? 0);
  const present = Number(summary?.present ?? 0);

  return {
    filters: {
      from: input.from,
      to: input.to,
      classId: input.classId ?? null,
      sectionId: input.sectionId ?? null,
    },
    summary: {
      present,
      absent: Number(summary?.absent ?? 0),
      late: Number(summary?.late ?? 0),
      leave: Number(summary?.leave ?? 0),
      total,
      presentRate: total > 0 ? Math.round((present / total) * 1000) / 10 : 0,
    },
    bySection: bySection.map((row) => ({
      sectionId: row.sectionId,
      sectionName: row.sectionName,
      className: row.className,
      present: Number(row.present),
      absent: Number(row.absent),
      late: Number(row.late),
      leave: Number(row.leave),
      total: Number(row.total),
    })),
    byDay: byDay.map((row) => ({
      date: row.date,
      present: Number(row.present),
      absent: Number(row.absent),
      late: Number(row.late),
      leave: Number(row.leave),
      total: Number(row.total),
    })),
  };
}

export async function getAcademicReport(input: {
  tenantId: string;
  examId?: string;
  classId?: string;
}) {
  let examId = input.examId;

  if (!examId) {
    const conditions = [eq(exams.tenantId, input.tenantId), isNull(exams.deletedAt)];
    if (input.classId) conditions.push(eq(exams.classId, input.classId));
    const [latest] = await db
      .select({ id: exams.id })
      .from(exams)
      .where(and(...conditions))
      .orderBy(desc(exams.createdAt))
      .limit(1);
    if (!latest) {
      return {
        exam: null,
        summary: {
          studentCount: 0,
          averagePercentage: 0,
          passCount: 0,
          failCount: 0,
        },
        subjectAverages: [],
        topStudents: [],
      };
    }
    examId = latest.id;
  }

  const [exam] = await db
    .select({
      id: exams.id,
      name: exams.name,
      classId: exams.classId,
      className: classes.name,
      status: exams.status,
      term: exams.term,
      academicYear: exams.academicYear,
      startDate: exams.startDate,
      endDate: exams.endDate,
    })
    .from(exams)
    .innerJoin(classes, eq(exams.classId, classes.id))
    .where(
      and(eq(exams.id, examId), eq(exams.tenantId, input.tenantId), isNull(exams.deletedAt)),
    )
    .limit(1);
  if (!exam) throw new NotFoundError('Exam');

  const subjectRows = await db
    .select({
      id: examSubjects.id,
      subjectName: subjects.name,
      maxMarks: examSubjects.maxMarks,
      passMarks: examSubjects.passMarks,
    })
    .from(examSubjects)
    .innerJoin(subjects, eq(examSubjects.subjectId, subjects.id))
    .where(and(eq(examSubjects.examId, exam.id), eq(examSubjects.tenantId, input.tenantId)));

  const subjectIds = subjectRows.map((row) => row.id);
  if (subjectIds.length === 0) {
    return {
      exam,
      summary: { studentCount: 0, averagePercentage: 0, passCount: 0, failCount: 0 },
      subjectAverages: [],
      topStudents: [],
    };
  }

  const studentRows = await db
    .select({
      id: students.id,
      fullName: students.fullName,
      admissionNo: students.admissionNo,
      sectionName: sections.name,
    })
    .from(students)
    .innerJoin(sections, eq(students.sectionId, sections.id))
    .where(
      and(
        eq(students.tenantId, input.tenantId),
        eq(students.classId, exam.classId),
        eq(students.status, 'active'),
        isNull(students.deletedAt),
      ),
    )
    .orderBy(asc(students.fullName));

  const marksSafe = await db
    .select({
      examSubjectId: examMarks.examSubjectId,
      studentId: examMarks.studentId,
      marksObtained: examMarks.marksObtained,
      isAbsent: examMarks.isAbsent,
    })
    .from(examMarks)
    .where(
      and(
        eq(examMarks.tenantId, input.tenantId),
        inArray(examMarks.examSubjectId, subjectIds),
      ),
    );

  const markMap = new Map(
    marksSafe.map((row) => [`${row.studentId}:${row.examSubjectId}`, row]),
  );

  const scored = studentRows.map((student) => {
    let totalObtained = 0;
    let totalMax = 0;
    let passedAll = true;
    let hasMarks = false;

    for (const subject of subjectRows) {
      totalMax += subject.maxMarks;
      const mark = markMap.get(`${student.id}:${subject.id}`);
      if (!mark || mark.isAbsent || mark.marksObtained === null) {
        passedAll = false;
        continue;
      }
      hasMarks = true;
      totalObtained += mark.marksObtained;
      if (mark.marksObtained < subject.passMarks) passedAll = false;
    }

    const percentage =
      totalMax > 0 ? Math.round((totalObtained / totalMax) * 1000) / 10 : 0;

    return {
      studentId: student.id,
      fullName: student.fullName,
      admissionNo: student.admissionNo,
      sectionName: student.sectionName,
      totalObtained,
      totalMax,
      percentage,
      passed: hasMarks && passedAll,
      hasMarks,
    };
  });

  const withMarks = scored.filter((row) => row.hasMarks);
  const averagePercentage =
    withMarks.length > 0
      ? Math.round(
          (withMarks.reduce((sum, row) => sum + row.percentage, 0) / withMarks.length) * 10,
        ) / 10
      : 0;

  const subjectAverages = subjectRows.map((subject) => {
    const values: number[] = [];
    for (const student of studentRows) {
      const mark = markMap.get(`${student.id}:${subject.id}`);
      if (mark && !mark.isAbsent && mark.marksObtained !== null) {
        values.push(mark.marksObtained);
      }
    }
    const avg =
      values.length > 0
        ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10
        : 0;
    return {
      examSubjectId: subject.id,
      subjectName: subject.subjectName,
      maxMarks: subject.maxMarks,
      passMarks: subject.passMarks,
      average: avg,
      markedCount: values.length,
    };
  });

  return {
    exam,
    summary: {
      studentCount: withMarks.length,
      averagePercentage,
      passCount: withMarks.filter((row) => row.passed).length,
      failCount: withMarks.filter((row) => !row.passed).length,
    },
    subjectAverages,
    topStudents: [...withMarks]
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 20),
  };
}
