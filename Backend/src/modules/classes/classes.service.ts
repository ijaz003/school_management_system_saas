import { and, asc, eq, ilike, inArray, isNull, sql } from 'drizzle-orm';
import { db } from '../../config/database.js';
import { BadRequestError, ConflictError, NotFoundError } from '../../lib/errors.js';
import { classSubjects } from '../class-subjects/class-subjects.schema.js';
import { sections } from '../sections/sections.schema.js';
import { subjects } from '../subjects/subjects.schema.js';
import { classes } from './classes.schema.js';
import type { CreateClassInput, UpdateClassInput } from './classes.types.js';

async function requireClass(classId: string, tenantId: string) {
  const [classRow] = await db
    .select()
    .from(classes)
    .where(and(
      eq(classes.id, classId),
      eq(classes.tenantId, tenantId),
      isNull(classes.deletedAt),
    ))
    .limit(1);
  if (!classRow) throw new NotFoundError('Class');
  return classRow;
}

export async function listClasses(params: { tenantId: string; search?: string }) {
  const items = await db
    .select()
    .from(classes)
    .where(and(
      eq(classes.tenantId, params.tenantId),
      isNull(classes.deletedAt),
      params.search ? ilike(classes.name, `%${params.search}%`) : undefined,
    ))
    .orderBy(asc(classes.order), asc(classes.name));

  return Promise.all(items.map(async (classRow) => {
    const [sectionCount, subjectCount] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` })
        .from(sections)
        .where(and(
          eq(sections.tenantId, params.tenantId),
          eq(sections.classId, classRow.id),
          isNull(sections.deletedAt),
        )),
      db.select({ count: sql<number>`count(*)::int` })
        .from(classSubjects)
        .where(and(
          eq(classSubjects.tenantId, params.tenantId),
          eq(classSubjects.classId, classRow.id),
        )),
    ]);
    return {
      ...classRow,
      sectionsCount: Number(sectionCount[0]?.count ?? 0),
      subjectsCount: Number(subjectCount[0]?.count ?? 0),
    };
  }));
}

export async function getClassById(id: string, tenantId: string) {
  const classRow = await requireClass(id, tenantId);
  const [classSections, classSubjectRows] = await Promise.all([
    db.select()
      .from(sections)
      .where(and(
        eq(sections.classId, id),
        eq(sections.tenantId, tenantId),
        isNull(sections.deletedAt),
      ))
      .orderBy(asc(sections.name)),
    db.select({
      id: subjects.id,
      name: subjects.name,
      code: subjects.code,
      isElective: subjects.isElective,
      isCompulsory: classSubjects.isCompulsory,
    })
      .from(classSubjects)
      .innerJoin(subjects, eq(classSubjects.subjectId, subjects.id))
      .where(and(
        eq(classSubjects.classId, id),
        eq(classSubjects.tenantId, tenantId),
        eq(subjects.tenantId, tenantId),
        isNull(subjects.deletedAt),
      ))
      .orderBy(asc(subjects.name)),
  ]);
  return { ...classRow, sections: classSections, subjects: classSubjectRows };
}

export async function createClass(input: CreateClassInput) {
  const name = input.data.name.trim();
  const [existing] = await db
    .select({ id: classes.id })
    .from(classes)
    .where(and(
      eq(classes.tenantId, input.tenantId),
      eq(classes.name, name),
      isNull(classes.deletedAt),
    ))
    .limit(1);
  if (existing) throw new ConflictError('Class name already exists');

  const [created] = await db
    .insert(classes)
    .values({
      tenantId: input.tenantId,
      name,
      order: input.data.order,
      type: input.data.type ?? 'common',
      description: input.data.description,
    })
    .returning();
  if (!created) throw new Error('Class insert did not return the created class');
  return created;
}

export async function updateClass(input: UpdateClassInput) {
  return db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(classes)
      .where(and(
        eq(classes.id, input.classId),
        eq(classes.tenantId, input.tenantId),
        isNull(classes.deletedAt),
      ))
      .for('update')
      .limit(1);
    if (!current) throw new NotFoundError('Class');

    const name = input.data.name?.trim();
    if (name && name !== current.name) {
      const [existing] = await tx
        .select({ id: classes.id })
        .from(classes)
        .where(and(
          eq(classes.tenantId, input.tenantId),
          eq(classes.name, name),
          isNull(classes.deletedAt),
        ))
        .limit(1);
      if (existing) throw new ConflictError('Class name already exists');
    }

    const [updated] = await tx
      .update(classes)
      .set({
        ...input.data,
        ...(name !== undefined ? { name } : {}),
        updatedAt: new Date(),
      })
      .where(and(
        eq(classes.id, input.classId),
        eq(classes.tenantId, input.tenantId),
      ))
      .returning();
    if (!updated) throw new NotFoundError('Class');

    if (name !== undefined || input.data.order !== undefined) {
      const activeSections = await tx
        .select({ id: sections.id, name: sections.name })
        .from(sections)
        .where(and(
          eq(sections.classId, input.classId),
          eq(sections.tenantId, input.tenantId),
          isNull(sections.deletedAt),
        ));
      for (const section of activeSections) {
        await tx
          .update(sections)
          .set({
            fullName: `${updated.order}-${section.name}`,
            updatedAt: new Date(),
          })
          .where(eq(sections.id, section.id));
      }
    }
    return updated;
  });
}

export async function deleteClass(classId: string, tenantId: string) {
  return db.transaction(async (tx) => {
    const [classRow] = await tx
      .select({ id: classes.id })
      .from(classes)
      .where(and(
        eq(classes.id, classId),
        eq(classes.tenantId, tenantId),
        isNull(classes.deletedAt),
      ))
      .for('update')
      .limit(1);
    if (!classRow) throw new NotFoundError('Class');

    const [sectionCount] = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(sections)
      .where(and(
        eq(sections.classId, classId),
        eq(sections.tenantId, tenantId),
        isNull(sections.deletedAt),
      ));
    const count = Number(sectionCount?.count ?? 0);
    if (count > 0) throw new BadRequestError(`Class has ${count} section(s). Delete them first.`);

    await tx
      .update(classes)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(classes.id, classId), eq(classes.tenantId, tenantId)));
  });
}

export async function addSubjectsToClass(classId: string, tenantId: string, subjectIds: string[]) {
  const ids = [...new Set(subjectIds)];
  if (ids.length !== subjectIds.length) throw new BadRequestError('Duplicate subject IDs are not allowed');

  return db.transaction(async (tx) => {
    const [classRow] = await tx
      .select({ id: classes.id })
      .from(classes)
      .where(and(
        eq(classes.id, classId),
        eq(classes.tenantId, tenantId),
        isNull(classes.deletedAt),
      ))
      .for('update')
      .limit(1);
    if (!classRow) throw new NotFoundError('Class');

    const validSubjects = await tx
      .select({ id: subjects.id })
      .from(subjects)
      .where(and(
        eq(subjects.tenantId, tenantId),
        inArray(subjects.id, ids),
        isNull(subjects.deletedAt),
      ));
    if (validSubjects.length !== ids.length) throw new BadRequestError('Some subjects do not exist in this school');

    const inserted = await tx
      .insert(classSubjects)
      .values(ids.map((subjectId) => ({ tenantId, classId, subjectId })))
      .onConflictDoNothing({
        target: [classSubjects.classId, classSubjects.subjectId],
      })
      .returning({ id: classSubjects.id });
    return { success: true, added: inserted.length };
  });
}

export async function removeSubjectFromClass(classId: string, subjectId: string, tenantId: string) {
  await requireClass(classId, tenantId);
  await db
    .delete(classSubjects)
    .where(and(
      eq(classSubjects.tenantId, tenantId),
      eq(classSubjects.classId, classId),
      eq(classSubjects.subjectId, subjectId),
    ));
}
