import { and, eq, ilike, isNull, or, sql } from 'drizzle-orm';
import { db } from '../../config/database.js';
import { BadRequestError, ConflictError, NotFoundError } from '../../lib/errors.js';
import { classSubjects } from '../class-subjects/class-subjects.schema.js';
import { sectionSubjects } from '../section-subjects/section-subjects.schema.js';
import { teacherAssignments } from '../teacher-assignments/teacher-assignments.schema.js';
import { subjects } from './subjects.schema.js';
import type { CreateSubjectInput, UpdateSubjectInput } from './subjects.types.js';

export async function listSubjects(params: { tenantId: string; search?: string }) {
  const filters = [
    eq(subjects.tenantId, params.tenantId),
    isNull(subjects.deletedAt),
  ];

  if (params.search) {
    filters.push(
      or(
        ilike(subjects.name, `%${params.search}%`),
        ilike(subjects.code, `%${params.search}%`),
      )!,
    );
  }

  const items = await db
    .select()
    .from(subjects)
    .where(and(...filters))
    .orderBy(subjects.name);

  return Promise.all(items.map(async (subject) => {
    const [classCount, sectionCount] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` })
        .from(classSubjects)
        .where(and(
          eq(classSubjects.tenantId, params.tenantId),
          eq(classSubjects.subjectId, subject.id),
        )),
      db.select({ count: sql<number>`count(*)::int` })
        .from(sectionSubjects)
        .where(and(
          eq(sectionSubjects.tenantId, params.tenantId),
          eq(sectionSubjects.subjectId, subject.id),
        )),
    ]);

    return {
      ...subject,
      usedInClasses: Number(classCount[0]?.count ?? 0),
      usedInSections: Number(sectionCount[0]?.count ?? 0),
    };
  }));
}

export async function getSubjectById(id: string, tenantId: string) {
  const [subject] = await db
    .select()
    .from(subjects)
    .where(and(
      eq(subjects.id, id),
      eq(subjects.tenantId, tenantId),
      isNull(subjects.deletedAt),
    ))
    .limit(1);

  if (!subject) throw new NotFoundError('Subject');
  return subject;
}

export async function createSubject(input: CreateSubjectInput) {
  const code = input.data.code.trim().toUpperCase();
  const [existing] = await db
    .select({ id: subjects.id })
    .from(subjects)
    .where(and(
      eq(subjects.tenantId, input.tenantId),
      eq(subjects.code, code),
      isNull(subjects.deletedAt),
    ))
    .limit(1);

  if (existing) throw new ConflictError('Subject code already exists');

  const [subject] = await db
    .insert(subjects)
    .values({
      tenantId: input.tenantId,
      name: input.data.name.trim(),
      code,
      description: input.data.description,
      isElective: input.data.isElective ?? false,
    })
    .returning();

  if (!subject) throw new Error('Subject insert did not return the created subject');
  return subject;
}

export async function updateSubject(input: UpdateSubjectInput) {
  await getSubjectById(input.subjectId, input.tenantId);
  const code = input.data.code?.trim().toUpperCase();

  if (code) {
    const [existing] = await db
      .select({ id: subjects.id })
      .from(subjects)
      .where(and(
        eq(subjects.tenantId, input.tenantId),
        eq(subjects.code, code),
        isNull(subjects.deletedAt),
      ))
      .limit(1);
    if (existing && existing.id !== input.subjectId) {
      throw new ConflictError('Subject code already exists');
    }
  }

  const [updated] = await db
    .update(subjects)
    .set({
      ...input.data,
      ...(input.data.name !== undefined ? { name: input.data.name.trim() } : {}),
      ...(code !== undefined ? { code } : {}),
      updatedAt: new Date(),
    })
    .where(and(
      eq(subjects.id, input.subjectId),
      eq(subjects.tenantId, input.tenantId),
      isNull(subjects.deletedAt),
    ))
    .returning();

  if (!updated) throw new NotFoundError('Subject');
  return updated;
}

export async function deleteSubject(subjectId: string, tenantId: string) {
  await getSubjectById(subjectId, tenantId);

  const [classUsage, sectionUsage, teacherUsage] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` })
      .from(classSubjects)
      .where(and(eq(classSubjects.tenantId, tenantId), eq(classSubjects.subjectId, subjectId))),
    db.select({ count: sql<number>`count(*)::int` })
      .from(sectionSubjects)
      .where(and(eq(sectionSubjects.tenantId, tenantId), eq(sectionSubjects.subjectId, subjectId))),
    db.select({ count: sql<number>`count(*)::int` })
      .from(teacherAssignments)
      .where(and(eq(teacherAssignments.tenantId, tenantId), eq(teacherAssignments.subjectId, subjectId))),
  ]);
  const totalUsage = Number(classUsage[0]?.count ?? 0)
    + Number(sectionUsage[0]?.count ?? 0)
    + Number(teacherUsage[0]?.count ?? 0);

  if (totalUsage > 0) {
    throw new BadRequestError(`Subject is assigned ${totalUsage} time(s). Remove its assignments first.`);
  }

  const [deleted] = await db
    .update(subjects)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(
      eq(subjects.id, subjectId),
      eq(subjects.tenantId, tenantId),
      isNull(subjects.deletedAt),
    ))
    .returning({ id: subjects.id });
  if (!deleted) throw new NotFoundError('Subject');
}
