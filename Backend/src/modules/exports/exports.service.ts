import { and, asc, desc, eq, ilike, inArray, isNull, or } from 'drizzle-orm';
import { db } from '../../config/database.js';
import { BadRequestError } from '../../lib/errors.js';
import { toCsv } from '../../lib/csv.js';
import { classes } from '../classes/classes.schema.js';
import { examMarks, examSubjects } from '../exams/exams.schema.js';
import { feeInvoices } from '../fees/fees.schema.js';
import { sections } from '../sections/sections.schema.js';
import { students } from '../students/students.schema.js';
import { subjects } from '../subjects/subjects.schema.js';
import { getExamById } from '../exams/exams.service.js';

const EXPORT_LIMIT = 5000;

export async function exportStudentsCsv(filters: {
  tenantId: string;
  search?: string;
  classId?: string;
  sectionId?: string;
  status?: string;
}) {
  const conditions = [eq(students.tenantId, filters.tenantId), isNull(students.deletedAt)];
  if (filters.classId) conditions.push(eq(students.classId, filters.classId));
  if (filters.sectionId) conditions.push(eq(students.sectionId, filters.sectionId));
  if (filters.status) conditions.push(eq(students.status, filters.status));
  if (filters.search) {
    const escaped = `%${filters.search.replace(/[\\%_]/g, '\\$&')}%`;
    const searchFilter = or(
      ilike(students.fullName, escaped),
      ilike(students.admissionNo, escaped),
      ilike(students.phone, escaped),
      ilike(students.guardianName, escaped),
      ilike(students.guardianPhone, escaped),
    );
    if (searchFilter) conditions.push(searchFilter);
  }

  const rows = await db
    .select({
      admissionNo: students.admissionNo,
      fullName: students.fullName,
      gender: students.gender,
      dateOfBirth: students.dateOfBirth,
      phone: students.phone,
      email: students.email,
      className: classes.name,
      sectionName: sections.name,
      guardianName: students.guardianName,
      guardianPhone: students.guardianPhone,
      status: students.status,
      admissionDate: students.admissionDate,
    })
    .from(students)
    .innerJoin(classes, eq(students.classId, classes.id))
    .innerJoin(sections, eq(students.sectionId, sections.id))
    .where(and(...conditions))
    .orderBy(asc(classes.name), asc(sections.name), asc(students.fullName))
    .limit(EXPORT_LIMIT);

  return toCsv(
    [
      'Admission No',
      'Full Name',
      'Gender',
      'Date of Birth',
      'Phone',
      'Email',
      'Class',
      'Section',
      'Guardian',
      'Guardian Phone',
      'Status',
      'Admission Date',
    ],
    rows.map((row) => [
      row.admissionNo,
      row.fullName,
      row.gender,
      row.dateOfBirth,
      row.phone,
      row.email,
      row.className,
      row.sectionName,
      row.guardianName,
      row.guardianPhone,
      row.status,
      row.admissionDate,
    ]),
  );
}

export async function exportInvoicesCsv(filters: {
  tenantId: string;
  search?: string;
  status?: string;
  classId?: string;
}) {
  const conditions = [eq(feeInvoices.tenantId, filters.tenantId), isNull(feeInvoices.deletedAt)];
  if (filters.status) conditions.push(eq(feeInvoices.status, filters.status));
  if (filters.classId) conditions.push(eq(students.classId, filters.classId));
  if (filters.search) {
    const escaped = `%${filters.search.replace(/[\\%_]/g, '\\$&')}%`;
    const searchFilter = or(
      ilike(feeInvoices.title, escaped),
      ilike(students.fullName, escaped),
      ilike(students.admissionNo, escaped),
    );
    if (searchFilter) conditions.push(searchFilter);
  }

  const rows = await db
    .select({
      title: feeInvoices.title,
      studentName: students.fullName,
      admissionNo: students.admissionNo,
      className: classes.name,
      amount: feeInvoices.amount,
      amountPaid: feeInvoices.amountPaid,
      status: feeInvoices.status,
      dueDate: feeInvoices.dueDate,
      periodLabel: feeInvoices.periodLabel,
      createdAt: feeInvoices.createdAt,
    })
    .from(feeInvoices)
    .innerJoin(students, eq(feeInvoices.studentId, students.id))
    .leftJoin(classes, eq(students.classId, classes.id))
    .where(and(...conditions))
    .orderBy(desc(feeInvoices.dueDate))
    .limit(EXPORT_LIMIT);

  return toCsv(
    [
      'Title',
      'Period',
      'Student',
      'Admission No',
      'Class',
      'Amount',
      'Paid',
      'Balance',
      'Status',
      'Due Date',
      'Created At',
    ],
    rows.map((row) => [
      row.title,
      row.periodLabel,
      row.studentName,
      row.admissionNo,
      row.className,
      row.amount,
      row.amountPaid,
      row.amount - row.amountPaid,
      row.status,
      row.dueDate,
      row.createdAt.toISOString(),
    ]),
  );
}

export async function exportExamMarksCsv(examId: string, tenantId: string) {
  const exam = await getExamById(examId, tenantId);
  const subjectRows = await db
    .select({
      id: examSubjects.id,
      subjectName: subjects.name,
      maxMarks: examSubjects.maxMarks,
      passMarks: examSubjects.passMarks,
    })
    .from(examSubjects)
    .innerJoin(subjects, eq(examSubjects.subjectId, subjects.id))
    .where(and(eq(examSubjects.examId, examId), eq(examSubjects.tenantId, tenantId)))
    .orderBy(asc(subjects.name));

  if (subjectRows.length === 0) {
    throw new BadRequestError('This exam has no subjects to export');
  }

  const studentConditions = [
    eq(students.tenantId, tenantId),
    eq(students.classId, exam.classId),
    eq(students.status, 'active'),
    isNull(students.deletedAt),
  ];
  if (exam.sectionId) studentConditions.push(eq(students.sectionId, exam.sectionId));

  const studentRows = await db
    .select({
      id: students.id,
      fullName: students.fullName,
      admissionNo: students.admissionNo,
      sectionName: sections.name,
    })
    .from(students)
    .innerJoin(sections, eq(students.sectionId, sections.id))
    .where(and(...studentConditions))
    .orderBy(asc(sections.name), asc(students.fullName))
    .limit(EXPORT_LIMIT);

  const subjectIds = subjectRows.map((row) => row.id);
  const marks =
    subjectIds.length === 0
      ? []
      : await db
          .select({
            examSubjectId: examMarks.examSubjectId,
            studentId: examMarks.studentId,
            marksObtained: examMarks.marksObtained,
            isAbsent: examMarks.isAbsent,
          })
          .from(examMarks)
          .where(
            and(
              eq(examMarks.tenantId, tenantId),
              inArray(examMarks.examSubjectId, subjectIds),
            ),
          );

  const markMap = new Map(
    marks.map((row) => [`${row.studentId}:${row.examSubjectId}`, row]),
  );

  const headers = [
    'Admission No',
    'Student',
    'Section',
    ...subjectRows.map((subject) => subject.subjectName),
    'Total Obtained',
    'Total Max',
    'Percentage',
  ];

  const rows = studentRows.map((student) => {
    let totalObtained = 0;
    let totalMax = 0;
    const subjectCells = subjectRows.map((subject) => {
      totalMax += subject.maxMarks;
      const mark = markMap.get(`${student.id}:${subject.id}`);
      if (mark?.isAbsent) return 'Absent';
      if (mark?.marksObtained == null) return '';
      totalObtained += mark.marksObtained;
      return mark.marksObtained;
    });
    const percentage =
      totalMax > 0 ? Math.round((totalObtained / totalMax) * 1000) / 10 : 0;
    return [
      student.admissionNo,
      student.fullName,
      student.sectionName,
      ...subjectCells,
      totalObtained,
      totalMax,
      percentage,
    ];
  });

  return {
    filename: `exam-marks-${exam.name.replace(/[^\w.-]+/g, '-').toLowerCase()}.csv`,
    csv: toCsv(headers, rows),
  };
}
