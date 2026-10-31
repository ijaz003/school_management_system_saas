import { and, asc, desc, eq, ilike, inArray, isNull, or, sql } from 'drizzle-orm';
import { db } from '../../config/database.js';
import { BadRequestError, ConflictError, NotFoundError } from '../../lib/errors.js';
import { users } from '../auth/auth.schema.js';
import { classes } from '../classes/classes.schema.js';
import { sections } from '../sections/sections.schema.js';
import { subjects } from '../subjects/subjects.schema.js';
import { teacherAssignments } from '../teacher-assignments/teacher-assignments.schema.js';
import * as sectionsService from '../sections/sections.service.js';
import type {
  CreateAssignmentInput,
  ListTeachersFilters,
  SetClassTeacherInput,
} from './teachers.types.js';

function toTeacher(user: typeof users.$inferSelect, assignmentCount = 0, classTeacherCount = 0) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    isActive: user.isActive,
    avatarUrl: user.avatarUrl,
    subject: typeof user.metadata === 'object' && user.metadata && 'subject' in user.metadata
      ? String((user.metadata as { subject?: string }).subject ?? '') || null
      : null,
    createdAt: user.createdAt,
    assignmentCount,
    classTeacherCount,
  };
}

async function requireTeacher(teacherId: string, tenantId: string) {
  const [teacher] = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.id, teacherId),
        eq(users.tenantId, tenantId),
        eq(users.role, 'teacher'),
        isNull(users.deletedAt),
      ),
    )
    .limit(1);
  if (!teacher) throw new NotFoundError('Teacher');
  return teacher;
}

async function requireActiveTeacher(teacherId: string, tenantId: string) {
  const teacher = await requireTeacher(teacherId, tenantId);
  if (!teacher.isActive) throw new BadRequestError('Teacher account is inactive');
  return teacher;
}

export async function listTeachers(filters: ListTeachersFilters) {
  const { tenantId, page = 1, limit = 20, search, isActive } = filters;
  const conditions = [
    eq(users.tenantId, tenantId),
    eq(users.role, 'teacher'),
    isNull(users.deletedAt),
  ];
  if (isActive !== undefined) conditions.push(eq(users.isActive, isActive));
  if (search) {
    const escaped = `%${search.replace(/[\\%_]/g, '\\$&')}%`;
    const searchFilter = or(
      ilike(users.fullName, escaped),
      ilike(users.email, escaped),
      ilike(users.phone, escaped),
    );
    if (searchFilter) conditions.push(searchFilter);
  }

  const where = and(...conditions);
  const offset = (page - 1) * limit;
  const [items, countRows] = await Promise.all([
    db.select().from(users).where(where).orderBy(desc(users.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(users).where(where),
  ]);

  const teacherIds = items.map((item) => item.id);
  const assignmentCounts = new Map<string, number>();
  const classTeacherCounts = new Map<string, number>();

  if (teacherIds.length > 0) {
    const [assignmentRows, classTeacherRows] = await Promise.all([
      db
        .select({
          teacherId: teacherAssignments.teacherId,
          count: sql<number>`count(*)::int`,
        })
        .from(teacherAssignments)
        .where(
          and(
            eq(teacherAssignments.tenantId, tenantId),
            inArray(teacherAssignments.teacherId, teacherIds),
          ),
        )
        .groupBy(teacherAssignments.teacherId),
      db
        .select({
          teacherId: sections.classTeacherId,
          count: sql<number>`count(*)::int`,
        })
        .from(sections)
        .where(
          and(
            eq(sections.tenantId, tenantId),
            isNull(sections.deletedAt),
            inArray(sections.classTeacherId, teacherIds),
          ),
        )
        .groupBy(sections.classTeacherId),
    ]);

    for (const row of assignmentRows) {
      assignmentCounts.set(row.teacherId, Number(row.count));
    }
    for (const row of classTeacherRows) {
      if (row.teacherId) classTeacherCounts.set(row.teacherId, Number(row.count));
    }
  }

  const total = countRows[0]?.count ?? 0;
  return {
    items: items.map((item) =>
      toTeacher(
        item,
        assignmentCounts.get(item.id) ?? 0,
        classTeacherCounts.get(item.id) ?? 0,
      ),
    ),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
}

export async function getTeacherById(teacherId: string, tenantId: string) {
  const teacher = await requireTeacher(teacherId, tenantId);

  const [assignments, classTeacherSections] = await Promise.all([
    listAssignments({ tenantId, teacherId }),
    db
      .select({
        sectionId: sections.id,
        sectionName: sections.name,
        fullName: sections.fullName,
        classId: classes.id,
        className: classes.name,
      })
      .from(sections)
      .innerJoin(classes, eq(sections.classId, classes.id))
      .where(
        and(
          eq(sections.tenantId, tenantId),
          eq(sections.classTeacherId, teacherId),
          isNull(sections.deletedAt),
          isNull(classes.deletedAt),
        ),
      )
      .orderBy(asc(classes.order), asc(sections.name)),
  ]);

  return {
    ...toTeacher(teacher, assignments.length, classTeacherSections.length),
    assignments,
    classTeacherSections,
  };
}

export async function listAssignments(filters: {
  tenantId: string;
  teacherId?: string;
  sectionId?: string;
  classId?: string;
}) {
  const conditions = [eq(teacherAssignments.tenantId, filters.tenantId)];
  if (filters.teacherId) conditions.push(eq(teacherAssignments.teacherId, filters.teacherId));
  if (filters.sectionId) conditions.push(eq(teacherAssignments.sectionId, filters.sectionId));
  if (filters.classId) conditions.push(eq(sections.classId, filters.classId));

  const rows = await db
    .select({
      id: teacherAssignments.id,
      teacherId: teacherAssignments.teacherId,
      teacherName: users.fullName,
      sectionId: teacherAssignments.sectionId,
      sectionName: sections.name,
      sectionFullName: sections.fullName,
      classId: classes.id,
      className: classes.name,
      subjectId: teacherAssignments.subjectId,
      subjectName: subjects.name,
      subjectCode: subjects.code,
      createdAt: teacherAssignments.createdAt,
    })
    .from(teacherAssignments)
    .innerJoin(users, eq(teacherAssignments.teacherId, users.id))
    .innerJoin(sections, eq(teacherAssignments.sectionId, sections.id))
    .innerJoin(classes, eq(sections.classId, classes.id))
    .innerJoin(subjects, eq(teacherAssignments.subjectId, subjects.id))
    .where(
      and(
        ...conditions,
        isNull(sections.deletedAt),
        isNull(classes.deletedAt),
        isNull(subjects.deletedAt),
        isNull(users.deletedAt),
      ),
    )
    .orderBy(desc(teacherAssignments.createdAt));

  return rows;
}

export async function createAssignment(input: CreateAssignmentInput) {
  const { tenantId, data } = input;
  await requireActiveTeacher(data.teacherId, tenantId);

  const [section] = await db
    .select()
    .from(sections)
    .where(
      and(
        eq(sections.id, data.sectionId),
        eq(sections.tenantId, tenantId),
        isNull(sections.deletedAt),
      ),
    )
    .limit(1);
  if (!section) throw new NotFoundError('Section');

  const sectionSubjects = await sectionsService.getSectionSubjects(section.id, tenantId);
  if (!sectionSubjects.some((subject) => subject.id === data.subjectId)) {
    throw new BadRequestError('Subject is not available for this section');
  }

  const [existingSame] = await db
    .select({ id: teacherAssignments.id })
    .from(teacherAssignments)
    .where(
      and(
        eq(teacherAssignments.tenantId, tenantId),
        eq(teacherAssignments.teacherId, data.teacherId),
        eq(teacherAssignments.sectionId, data.sectionId),
        eq(teacherAssignments.subjectId, data.subjectId),
      ),
    )
    .limit(1);
  if (existingSame) throw new ConflictError('This teacher is already assigned to that subject in the section');

  const [existingSubject] = await db
    .select({ id: teacherAssignments.id, teacherId: teacherAssignments.teacherId })
    .from(teacherAssignments)
    .where(
      and(
        eq(teacherAssignments.tenantId, tenantId),
        eq(teacherAssignments.sectionId, data.sectionId),
        eq(teacherAssignments.subjectId, data.subjectId),
      ),
    )
    .limit(1);
  if (existingSubject) {
    throw new ConflictError('This subject already has a teacher in the selected section');
  }

  const [created] = await db
    .insert(teacherAssignments)
    .values({
      tenantId,
      teacherId: data.teacherId,
      sectionId: data.sectionId,
      subjectId: data.subjectId,
    })
    .returning({ id: teacherAssignments.id });

  if (!created) throw new BadRequestError('Could not create assignment');

  const createdRow = (await listAssignments({ tenantId, teacherId: data.teacherId })).find(
    (item) => item.id === created.id,
  );
  if (!createdRow) throw new NotFoundError('Assignment');
  return createdRow;
}

export async function deleteAssignment(assignmentId: string, tenantId: string) {
  const [existing] = await db
    .select({ id: teacherAssignments.id })
    .from(teacherAssignments)
    .where(
      and(eq(teacherAssignments.id, assignmentId), eq(teacherAssignments.tenantId, tenantId)),
    )
    .limit(1);
  if (!existing) throw new NotFoundError('Assignment');

  await db
    .delete(teacherAssignments)
    .where(
      and(eq(teacherAssignments.id, assignmentId), eq(teacherAssignments.tenantId, tenantId)),
    );
}

export async function setClassTeacher(input: SetClassTeacherInput) {
  const { tenantId, sectionId, teacherId } = input;

  if (teacherId) await requireActiveTeacher(teacherId, tenantId);

  const [section] = await db
    .select({ id: sections.id })
    .from(sections)
    .where(
      and(eq(sections.id, sectionId), eq(sections.tenantId, tenantId), isNull(sections.deletedAt)),
    )
    .limit(1);
  if (!section) throw new NotFoundError('Section');

  const updated = await sectionsService.updateSection({
    sectionId,
    tenantId,
    data: { classTeacherId: teacherId },
  });

  let teacherName: string | null = null;
  if (updated.classTeacherId) {
    const teacher = await requireTeacher(updated.classTeacherId, tenantId);
    teacherName = teacher.fullName;
  }

  return {
    sectionId: updated.id,
    classTeacherId: updated.classTeacherId,
    classTeacherName: teacherName,
    fullName: updated.fullName,
  };
}
