import { and, asc, desc, eq, ilike, inArray, isNull, sql } from 'drizzle-orm';
import { db } from '../../config/database.js';
import { BadRequestError, NotFoundError } from '../../lib/errors.js';
import { classes } from '../classes/classes.schema.js';
import { classSubjects } from '../class-subjects/class-subjects.schema.js';
import { sectionSubjects } from '../section-subjects/section-subjects.schema.js';
import { sections } from '../sections/sections.schema.js';
import { students } from '../students/students.schema.js';
import { subjects } from '../subjects/subjects.schema.js';
import { users } from '../auth/auth.schema.js';
import { tenants } from '../tenants/tenants.schema.js';
import { examMarks, exams, examSubjects } from './exams.schema.js';
import type {
  CreateExamInput,
  GetMarksSheetInput,
  ListExamsFilters,
  SaveMarksInput,
  SetExamSubjectsInput,
  UpdateExamInput,
} from './exams.types.js';

async function requireClass(classId: string, tenantId: string) {
  const [row] = await db
    .select()
    .from(classes)
    .where(
      and(eq(classes.id, classId), eq(classes.tenantId, tenantId), isNull(classes.deletedAt)),
    )
    .limit(1);
  if (!row) throw new NotFoundError('Class');
  return row;
}

async function requireExam(examId: string, tenantId: string) {
  const [row] = await db
    .select()
    .from(exams)
    .where(
      and(eq(exams.id, examId), eq(exams.tenantId, tenantId), isNull(exams.deletedAt)),
    )
    .limit(1);
  if (!row) throw new NotFoundError('Exam');
  return row;
}

async function requireSectionForClass(
  sectionId: string,
  classId: string,
  tenantId: string,
) {
  const [row] = await db
    .select({
      id: sections.id,
      name: sections.name,
      classId: sections.classId,
      useClassSubjects: sections.useClassSubjects,
    })
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

async function loadExamSubjects(examId: string, tenantId: string) {
  return db
    .select({
      id: examSubjects.id,
      subjectId: examSubjects.subjectId,
      subjectName: subjects.name,
      subjectCode: subjects.code,
      maxMarks: examSubjects.maxMarks,
      passMarks: examSubjects.passMarks,
      examDate: examSubjects.examDate,
    })
    .from(examSubjects)
    .innerJoin(subjects, eq(examSubjects.subjectId, subjects.id))
    .where(and(eq(examSubjects.examId, examId), eq(examSubjects.tenantId, tenantId)))
    .orderBy(asc(subjects.name));
}

async function getExamMapped(examId: string, tenantId: string) {
  const [rows, subjectRows] = await Promise.all([
    db
      .select({
        id: exams.id,
        name: exams.name,
        classId: exams.classId,
        className: classes.name,
        sectionId: exams.sectionId,
        sectionName: sections.name,
        term: exams.term,
        academicYear: exams.academicYear,
        startDate: exams.startDate,
        endDate: exams.endDate,
        status: exams.status,
        publishedAt: exams.publishedAt,
        createdBy: exams.createdBy,
        createdByName: users.fullName,
        createdAt: exams.createdAt,
        updatedAt: exams.updatedAt,
      })
      .from(exams)
      .innerJoin(classes, eq(exams.classId, classes.id))
      .leftJoin(sections, eq(exams.sectionId, sections.id))
      .leftJoin(users, eq(exams.createdBy, users.id))
      .where(and(eq(exams.id, examId), eq(exams.tenantId, tenantId), isNull(exams.deletedAt)))
      .limit(1),
    loadExamSubjects(examId, tenantId),
  ]);
  const [row] = rows;
  if (!row) throw new NotFoundError('Exam');

  return { ...row, subjects: subjectRows };
}

async function replaceSubjects(
  examId: string,
  tenantId: string,
  classId: string,
  sectionId: string | null,
  subjectInputs: CreateExamInput['data']['subjects'],
) {
  if (!subjectInputs || subjectInputs.length === 0) return;

  const subjectIds = subjectInputs.map((item) => item.subjectId);
  if (new Set(subjectIds).size !== subjectIds.length) {
    throw new BadRequestError('Duplicate subjects are not allowed');
  }

  const section = sectionId
    ? await requireSectionForClass(sectionId, classId, tenantId)
    : null;
  const allowed = section && !section.useClassSubjects
    ? await db
        .select({ subjectId: sectionSubjects.subjectId })
        .from(sectionSubjects)
        .where(
          and(
            eq(sectionSubjects.tenantId, tenantId),
            eq(sectionSubjects.sectionId, section.id),
            inArray(sectionSubjects.subjectId, subjectIds),
          ),
        )
    : await db
    .select({ subjectId: classSubjects.subjectId })
    .from(classSubjects)
    .where(
      and(
        eq(classSubjects.tenantId, tenantId),
        eq(classSubjects.classId, classId),
        inArray(classSubjects.subjectId, subjectIds),
      ),
    );
  if (allowed.length !== subjectIds.length) {
    throw new BadRequestError('One or more subjects are not assigned to this section');
  }

  await db
    .delete(examSubjects)
    .where(and(eq(examSubjects.examId, examId), eq(examSubjects.tenantId, tenantId)));

  await db.insert(examSubjects).values(
    subjectInputs.map((item) => ({
      tenantId,
      examId,
      subjectId: item.subjectId,
      maxMarks: item.maxMarks,
      passMarks: item.passMarks,
      examDate: item.examDate ?? null,
    })),
  );
}

export async function listExams(filters: ListExamsFilters) {
  const { tenantId, page = 1, limit = 20, search, classId, status } = filters;
  const conditions = [eq(exams.tenantId, tenantId), isNull(exams.deletedAt)];
  if (classId) conditions.push(eq(exams.classId, classId));
  if (status) conditions.push(eq(exams.status, status));
  if (search) {
    const escaped = `%${search.replace(/[\\%_]/g, '\\$&')}%`;
    conditions.push(ilike(exams.name, escaped));
  }

  const where = and(...conditions);
  const offset = (page - 1) * limit;

  const [rows, countRows] = await Promise.all([
    db
      .select({
        id: exams.id,
        name: exams.name,
        classId: exams.classId,
        className: classes.name,
        sectionId: exams.sectionId,
        sectionName: sections.name,
        term: exams.term,
        academicYear: exams.academicYear,
        startDate: exams.startDate,
        endDate: exams.endDate,
        status: exams.status,
        publishedAt: exams.publishedAt,
        createdAt: exams.createdAt,
        subjectsCount: sql<number>`(
          select count(*)::int from exam_subjects es
          where es.exam_id = ${exams.id}
        )`,
      })
      .from(exams)
      .innerJoin(classes, eq(exams.classId, classes.id))
      .leftJoin(sections, eq(exams.sectionId, sections.id))
      .where(where)
      .orderBy(desc(exams.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(exams).where(where),
  ]);

  const total = countRows[0]?.count ?? 0;
  return {
    items: rows,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
}

export async function getExamById(examId: string, tenantId: string) {
  return getExamMapped(examId, tenantId);
}

export async function createExam(input: CreateExamInput) {
  await requireClass(input.data.classId, input.tenantId);
  await requireSectionForClass(input.data.sectionId, input.data.classId, input.tenantId);

  const [created] = await db
    .insert(exams)
    .values({
      tenantId: input.tenantId,
      name: input.data.name.trim(),
      classId: input.data.classId,
      sectionId: input.data.sectionId,
      term: input.data.term?.trim() || null,
      academicYear: input.data.academicYear?.trim() || null,
      startDate: input.data.startDate,
      endDate: input.data.endDate,
      status: input.data.status ?? 'draft',
      createdBy: input.createdBy,
    })
    .returning({ id: exams.id });

  if (!created) throw new BadRequestError('Could not create exam');

  try {
    await replaceSubjects(
      created.id,
      input.tenantId,
      input.data.classId,
      input.data.sectionId,
      input.data.subjects,
    );
  } catch (error) {
    await db.delete(exams).where(eq(exams.id, created.id));
    throw error;
  }

  return getExamMapped(created.id, input.tenantId);
}

export async function updateExam(input: UpdateExamInput) {
  const existing = await requireExam(input.examId, input.tenantId);
  if (existing.status === 'published') {
    throw new BadRequestError('Published exams cannot be edited');
  }

  const startDate = input.data.startDate ?? existing.startDate;
  const endDate = input.data.endDate ?? existing.endDate;
  if (endDate < startDate) {
    throw new BadRequestError('endDate must be on or after startDate');
  }

  await db
    .update(exams)
    .set({
      ...(input.data.name !== undefined ? { name: input.data.name.trim() } : {}),
      ...(input.data.term !== undefined ? { term: input.data.term?.trim() || null } : {}),
      ...(input.data.academicYear !== undefined
        ? { academicYear: input.data.academicYear?.trim() || null }
        : {}),
      ...(input.data.startDate !== undefined ? { startDate: input.data.startDate } : {}),
      ...(input.data.endDate !== undefined ? { endDate: input.data.endDate } : {}),
      ...(input.data.status !== undefined ? { status: input.data.status } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(exams.id, existing.id), eq(exams.tenantId, input.tenantId)));

  return getExamMapped(existing.id, input.tenantId);
}

export async function deleteExam(examId: string, tenantId: string) {
  const existing = await requireExam(examId, tenantId);
  if (existing.status === 'published') {
    throw new BadRequestError('Published exams cannot be deleted');
  }
  await db
    .update(exams)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(exams.id, existing.id), eq(exams.tenantId, tenantId)));
}

export async function setExamSubjects(input: SetExamSubjectsInput) {
  const exam = await requireExam(input.examId, input.tenantId);
  if (exam.status === 'published') {
    throw new BadRequestError('Cannot change subjects on a published exam');
  }
  await replaceSubjects(
    exam.id,
    input.tenantId,
    exam.classId,
    exam.sectionId,
    input.subjects,
  );
  if (exam.status === 'draft') {
    await db
      .update(exams)
      .set({ status: 'scheduled', updatedAt: new Date() })
      .where(eq(exams.id, exam.id));
  }
  return getExamMapped(exam.id, input.tenantId);
}

export async function openMarksEntry(examId: string, tenantId: string) {
  const exam = await requireExam(examId, tenantId);
  if (exam.status === 'published') {
    throw new BadRequestError('Exam is already published');
  }
  const subjectCount = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(examSubjects)
    .where(and(eq(examSubjects.examId, exam.id), eq(examSubjects.tenantId, tenantId)));
  if ((subjectCount[0]?.count ?? 0) === 0) {
    throw new BadRequestError('Add subjects before opening marks entry');
  }
  await db
    .update(exams)
    .set({ status: 'marks_entry', updatedAt: new Date() })
    .where(eq(exams.id, exam.id));
  return getExamMapped(exam.id, tenantId);
}

export async function publishExam(examId: string, tenantId: string) {
  const exam = await requireExam(examId, tenantId);
  if (exam.status === 'published') {
    return getExamMapped(exam.id, tenantId);
  }
  if (exam.status === 'draft') {
    throw new BadRequestError('Schedule subjects and enter marks before publishing');
  }
  await db
    .update(exams)
    .set({
      status: 'published',
      publishedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(exams.id, exam.id));
  return getExamMapped(exam.id, tenantId);
}

export async function getMarksSheet(input: GetMarksSheetInput) {
  const exam = await requireExam(input.examId, input.tenantId);
  const [section, examSubjectRows] = await Promise.all([
    requireSectionForClass(input.sectionId, exam.classId, input.tenantId),
    db
      .select({
        id: examSubjects.id,
        subjectId: examSubjects.subjectId,
        subjectName: subjects.name,
        maxMarks: examSubjects.maxMarks,
        passMarks: examSubjects.passMarks,
        examDate: examSubjects.examDate,
      })
      .from(examSubjects)
      .innerJoin(subjects, eq(examSubjects.subjectId, subjects.id))
      .where(
        and(
          eq(examSubjects.id, input.examSubjectId),
          eq(examSubjects.examId, exam.id),
          eq(examSubjects.tenantId, input.tenantId),
        ),
      )
      .limit(1),
  ]);
  if (exam.sectionId && exam.sectionId !== section.id) {
    throw new BadRequestError('This exam is assigned to a different section');
  }
  const [examSubject] = examSubjectRows;
  if (!examSubject) throw new NotFoundError('Exam subject');

  const records = await db
    .select({
      studentId: students.id,
      fullName: students.fullName,
      admissionNo: students.admissionNo,
      marksObtained: examMarks.marksObtained,
      isAbsent: examMarks.isAbsent,
      remarks: examMarks.remarks,
      markId: examMarks.id,
    })
    .from(students)
    .leftJoin(
      examMarks,
      and(
        eq(examMarks.studentId, students.id),
        eq(examMarks.tenantId, input.tenantId),
        eq(examMarks.examSubjectId, examSubject.id),
      ),
    )
    .where(
      and(
        eq(students.tenantId, input.tenantId),
        eq(students.sectionId, section.id),
        eq(students.status, 'active'),
        isNull(students.deletedAt),
      ),
    )
    .orderBy(asc(students.fullName));

  return {
    exam: {
      id: exam.id,
      name: exam.name,
      status: exam.status,
      classId: exam.classId,
    },
    section: { id: section.id, name: section.name },
    examSubject,
    records,
    readOnly: exam.status === 'published',
  };
}

export async function saveMarks(input: SaveMarksInput) {
  const exam = await requireExam(input.examId, input.tenantId);
  if (exam.status === 'published') {
    throw new BadRequestError('Cannot edit marks on a published exam');
  }
  if (exam.status === 'draft') {
    throw new BadRequestError('Open marks entry before saving marks');
  }

  const [section, examSubjectRows] = await Promise.all([
    requireSectionForClass(input.sectionId, exam.classId, input.tenantId),
    db
      .select()
      .from(examSubjects)
      .where(
        and(
          eq(examSubjects.id, input.examSubjectId),
          eq(examSubjects.examId, exam.id),
          eq(examSubjects.tenantId, input.tenantId),
        ),
      )
      .limit(1),
  ]);
  if (exam.sectionId && exam.sectionId !== section.id) {
    throw new BadRequestError('This exam is assigned to a different section');
  }

  const [examSubject] = examSubjectRows;
  if (!examSubject) throw new NotFoundError('Exam subject');

  const studentIds = input.records.map((record) => record.studentId);
  const validStudents = await db
    .select({ id: students.id })
    .from(students)
    .where(
      and(
        eq(students.tenantId, input.tenantId),
        eq(students.sectionId, section.id),
        eq(students.status, 'active'),
        isNull(students.deletedAt),
        inArray(students.id, studentIds),
      ),
    );
  if (validStudents.length !== studentIds.length) {
    throw new BadRequestError('One or more students are invalid for this section');
  }

  const markValues = input.records.map((record) => {
    const isAbsent = record.isAbsent === true;
    if (!isAbsent) {
      if (record.marksObtained === undefined || record.marksObtained === null) {
        throw new BadRequestError('marksObtained is required unless student is absent');
      }
      if (record.marksObtained > examSubject.maxMarks) {
        throw new BadRequestError(
          `Marks cannot exceed max marks (${examSubject.maxMarks})`,
        );
      }
    }
    return {
      tenantId: input.tenantId,
      examSubjectId: examSubject.id,
      studentId: record.studentId,
      marksObtained: isAbsent ? null : (record.marksObtained ?? null),
      isAbsent,
      remarks: record.remarks?.trim() || null,
      enteredBy: input.enteredBy,
      updatedAt: new Date(),
    };
  });

  await db.transaction(async (tx) => {
    await tx
      .insert(examMarks)
      .values(markValues)
      .onConflictDoUpdate({
        target: [examMarks.examSubjectId, examMarks.studentId],
        set: {
          marksObtained: sql`excluded.marks_obtained`,
          isAbsent: sql`excluded.is_absent`,
          remarks: sql`excluded.remarks`,
          enteredBy: sql`excluded.entered_by`,
          updatedAt: sql`excluded.updated_at`,
        },
      });

    if (exam.status === 'scheduled') {
      await tx
        .update(exams)
        .set({ status: 'marks_entry', updatedAt: new Date() })
        .where(eq(exams.id, exam.id));
    }
  });

  return getMarksSheet({
    tenantId: input.tenantId,
    examId: exam.id,
    examSubjectId: examSubject.id,
    sectionId: section.id,
  });
}

export async function getExamResults(
  examId: string,
  tenantId: string,
  studentId?: string,
) {
  const exam = await getExamMapped(examId, tenantId);
  const subjectIds = exam.subjects.map((subject) => subject.id);

  const studentConditions = [
    eq(students.tenantId, tenantId),
    eq(students.classId, exam.classId),
    eq(students.status, 'active'),
    isNull(students.deletedAt),
  ];
  if (exam.sectionId) studentConditions.push(eq(students.sectionId, exam.sectionId));
  if (studentId) studentConditions.push(eq(students.id, studentId));

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
    .orderBy(asc(sections.name), asc(students.fullName));

  const studentIds = studentRows.map((student) => student.id);
  const marks =
    subjectIds.length === 0 || studentIds.length === 0
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
              inArray(examMarks.studentId, studentIds),
            ),
          );

  const marksByStudent = new Map<string, Map<string, (typeof marks)[number]>>();
  for (const mark of marks) {
    let studentMarks = marksByStudent.get(mark.studentId);
    if (!studentMarks) {
      studentMarks = new Map();
      marksByStudent.set(mark.studentId, studentMarks);
    }
    studentMarks.set(mark.examSubjectId, mark);
  }

  const totalMax = exam.subjects.reduce((total, subject) => total + subject.maxMarks, 0);
  const results = studentRows.map((student) => {
    let totalObtained = 0;
    let absentCount = 0;
    const subjectResults = exam.subjects.map((subject) => {
      const mark = marksByStudent.get(student.id)?.get(subject.id);
      if (mark?.isAbsent) {
        absentCount += 1;
        return {
          examSubjectId: subject.id,
          subjectName: subject.subjectName,
          maxMarks: subject.maxMarks,
          passMarks: subject.passMarks,
          marksObtained: null,
          isAbsent: true,
          passed: false,
        };
      }
      const obtained = mark?.marksObtained ?? null;
      if (obtained !== null) totalObtained += obtained;
      return {
        examSubjectId: subject.id,
        subjectName: subject.subjectName,
        maxMarks: subject.maxMarks,
        passMarks: subject.passMarks,
        marksObtained: obtained,
        isAbsent: false,
        passed: obtained !== null ? obtained >= subject.passMarks : false,
      };
    });

    return {
      studentId: student.id,
      fullName: student.fullName,
      admissionNo: student.admissionNo,
      sectionName: student.sectionName,
      totalObtained,
      totalMax,
      percentage: totalMax > 0 ? Math.round((totalObtained / totalMax) * 1000) / 10 : 0,
      absentCount,
      subjects: subjectResults,
    };
  });

  return { exam, results };
}

type ExamResultsData = Awaited<ReturnType<typeof getExamResults>>;

function mapReportCard(
  exam: ExamResultsData['exam'],
  result: ExamResultsData['results'][number],
  tenant:
    | { name: string; city: string | null; address: string | null; logoUrl: string | null }
    | undefined,
) {
  let gradedCount = 0;
  let passedAll = true;
  for (const subject of result.subjects) {
    if (subject.isAbsent || subject.marksObtained === null) continue;
    gradedCount++;
    if (!subject.passed) passedAll = false;
  }

  return {
    school: {
      name: tenant?.name ?? 'School',
      city: tenant?.city ?? null,
      address: tenant?.address ?? null,
      logoUrl: tenant?.logoUrl ?? null,
    },
    exam: {
      id: exam.id,
      name: exam.name,
      className: exam.className,
      term: exam.term,
      academicYear: exam.academicYear,
      startDate: exam.startDate,
      endDate: exam.endDate,
      status: exam.status,
    },
    student: {
      id: result.studentId,
      fullName: result.fullName,
      admissionNo: result.admissionNo,
      sectionName: result.sectionName,
    },
    subjects: result.subjects,
    totals: {
      obtained: result.totalObtained,
      max: result.totalMax,
      percentage: result.percentage,
      absentCount: result.absentCount,
      result: passedAll && gradedCount > 0 ? 'Pass' : gradedCount === 0 ? 'Incomplete' : 'Fail',
    },
    generatedAt: new Date().toISOString(),
  };
}

async function getTenantForReportCard(tenantId: string) {
  const [tenant] = await db
    .select({
      name: tenants.name,
      city: tenants.city,
      address: tenants.address,
      logoUrl: tenants.logoUrl,
    })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);
  return tenant;
}

export async function getExamReportCards(examId: string, tenantId: string) {
  const [{ exam, results }, tenant] = await Promise.all([
    getExamResults(examId, tenantId),
    getTenantForReportCard(tenantId),
  ]);
  return { exam, cards: results.map((result) => mapReportCard(exam, result, tenant)) };
}

export async function getStudentReportCard(
  examId: string,
  studentId: string,
  tenantId: string,
) {
  const [{ exam, results }, tenant] = await Promise.all([
    getExamResults(examId, tenantId, studentId),
    getTenantForReportCard(tenantId),
  ]);
  const result = results[0];
  if (!result) throw new NotFoundError('Report card');
  const card = mapReportCard(exam, result, tenant);
  return { exam, card };
}
