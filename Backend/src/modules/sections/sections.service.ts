import { and, asc, eq, inArray, isNull } from 'drizzle-orm';
import { db } from '../../config/database.js';
import { BadRequestError, ConflictError, NotFoundError } from '../../lib/errors.js';
import { users } from '../auth/auth.schema.js';
import { classSubjects } from '../class-subjects/class-subjects.schema.js';
import { classes } from '../classes/classes.schema.js';
import { sectionSubjects } from '../section-subjects/section-subjects.schema.js';
import { subjects } from '../subjects/subjects.schema.js';
import { teacherAssignments } from '../teacher-assignments/teacher-assignments.schema.js';
import { sections } from './sections.schema.js';
import type { CreateSectionInput, UpdateSectionInput } from './sections.types.js';

type SectionRow = typeof sections.$inferSelect;

async function getSubjectsForSection(section: SectionRow, tenantId: string) {
  if (section.useClassSubjects) {
    return db
      .select({
        id: subjects.id,
        name: subjects.name,
        code: subjects.code,
        isElective: subjects.isElective,
        isCompulsory: classSubjects.isCompulsory,
      })
      .from(classSubjects)
      .innerJoin(subjects, eq(classSubjects.subjectId, subjects.id))
      .where(and(
        eq(classSubjects.tenantId, tenantId),
        eq(classSubjects.classId, section.classId),
        eq(subjects.tenantId, tenantId),
        isNull(subjects.deletedAt),
      ))
      .orderBy(asc(subjects.name));
  }

  return db
    .select({
      id: subjects.id,
      name: subjects.name,
      code: subjects.code,
      isElective: subjects.isElective,
    })
    .from(sectionSubjects)
    .innerJoin(subjects, eq(sectionSubjects.subjectId, subjects.id))
    .where(and(
      eq(sectionSubjects.tenantId, tenantId),
      eq(sectionSubjects.sectionId, section.id),
      eq(subjects.tenantId, tenantId),
      isNull(subjects.deletedAt),
    ))
    .orderBy(asc(subjects.name));
}

async function validateTeacher(tenantId: string, teacherId?: string | null) {
  if (!teacherId) return;
  const [teacher] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(
      eq(users.id, teacherId),
      eq(users.tenantId, tenantId),
      eq(users.role, 'teacher'),
      eq(users.isActive, true),
      isNull(users.deletedAt),
    ))
    .limit(1);
  if (!teacher) throw new BadRequestError('Class teacher must be an active teacher in this school');
}

export async function listSectionsByClass(classId: string, tenantId: string) {
  const [classRow] = await db
    .select({ id: classes.id })
    .from(classes)
    .where(and(
      eq(classes.id, classId),
      eq(classes.tenantId, tenantId),
      isNull(classes.deletedAt),
    ))
    .limit(1);
  if (!classRow) throw new NotFoundError('Class');

  const items = await db
    .select()
    .from(sections)
    .where(and(
      eq(sections.classId, classId),
      eq(sections.tenantId, tenantId),
      isNull(sections.deletedAt),
    ))
    .orderBy(asc(sections.name));
  return Promise.all(items.map(async (section) => ({
    ...section,
    subjects: await getSubjectsForSection(section, tenantId),
  })));
}

export async function getSectionById(id: string, tenantId: string) {
  const [section] = await db
    .select()
    .from(sections)
    .where(and(
      eq(sections.id, id),
      eq(sections.tenantId, tenantId),
      isNull(sections.deletedAt),
    ))
    .limit(1);
  if (!section) throw new NotFoundError('Section');
  return section;
}

export async function getSectionSubjects(sectionId: string, tenantId: string) {
  const section = await getSectionById(sectionId, tenantId);
  return getSubjectsForSection(section, tenantId);
}

export async function createSection(input: CreateSectionInput) {
  const { tenantId, data } = input;
  const useClassSubjects = data.useClassSubjects ?? true;
  const subjectIds = [...new Set(data.subjectIds ?? [])];
  if (subjectIds.length !== (data.subjectIds ?? []).length) {
    throw new BadRequestError('Duplicate subject IDs are not allowed');
  }
  if (!useClassSubjects && subjectIds.length === 0) {
    throw new BadRequestError('Select at least one subject for a custom subject list');
  }

  return db.transaction(async (tx) => {
    const [classRow] = await tx
      .select()
      .from(classes)
      .where(and(
        eq(classes.id, data.classId),
        eq(classes.tenantId, tenantId),
        isNull(classes.deletedAt),
      ))
      .for('update')
      .limit(1);
    if (!classRow) throw new NotFoundError('Class');

    const [existing] = await tx
      .select({ id: sections.id })
      .from(sections)
      .where(and(
        eq(sections.classId, data.classId),
        eq(sections.tenantId, tenantId),
        eq(sections.name, data.name),
        isNull(sections.deletedAt),
      ))
      .limit(1);
    if (existing) throw new ConflictError('Section name already exists in this class');

    await validateTeacher(tenantId, data.classTeacherId);
    if (!useClassSubjects) {
      const rows = await tx
        .select({ id: subjects.id })
        .from(subjects)
        .where(and(
          eq(subjects.tenantId, tenantId),
          inArray(subjects.id, subjectIds),
          isNull(subjects.deletedAt),
        ));
      if (rows.length !== subjectIds.length) {
        throw new BadRequestError('Some subjects do not exist in this school');
      }
    }

    const [created] = await tx
      .insert(sections)
      .values({
        tenantId,
        classId: data.classId,
        name: data.name,
        fullName: `${classRow.order}-${data.name}`,
        useClassSubjects,
        stream: data.stream,
        capacity: data.capacity ?? 40,
        classTeacherId: data.classTeacherId ?? null,
      })
      .returning();
    if (!created) throw new Error('Section insert did not return the created section');

    if (!useClassSubjects) {
      await tx.insert(sectionSubjects).values(
        subjectIds.map((subjectId) => ({ tenantId, sectionId: created.id, subjectId })),
      );
    }
    return created;
  });
}

export async function updateSection(input: UpdateSectionInput) {
  return db.transaction(async (tx) => {
    const [section] = await tx
      .select()
      .from(sections)
      .where(and(
        eq(sections.id, input.sectionId),
        eq(sections.tenantId, input.tenantId),
        isNull(sections.deletedAt),
      ))
      .for('update')
      .limit(1);
    if (!section) throw new NotFoundError('Section');

    const useClassSubjects = input.data.useClassSubjects ?? section.useClassSubjects;
    const subjectIds = input.data.subjectIds === undefined
      ? undefined
      : [...new Set(input.data.subjectIds)];
    if (subjectIds && subjectIds.length !== input.data.subjectIds?.length) {
      throw new BadRequestError('Duplicate subject IDs are not allowed');
    }
    if (section.useClassSubjects && !useClassSubjects && subjectIds === undefined) {
      throw new BadRequestError('Select subjects when switching to custom subjects');
    }
    if (subjectIds && !useClassSubjects && subjectIds.length === 0) {
      throw new BadRequestError('Select at least one subject for a custom subject list');
    }
    if (subjectIds && subjectIds.length > 0) {
      const validSubjects = await tx
        .select({ id: subjects.id })
        .from(subjects)
        .where(and(
          eq(subjects.tenantId, input.tenantId),
          inArray(subjects.id, subjectIds),
          isNull(subjects.deletedAt),
        ));
      if (validSubjects.length !== subjectIds.length) {
        throw new BadRequestError('Some subjects do not exist in this school');
      }
    }

    if (input.data.classTeacherId !== undefined) {
      await validateTeacher(input.tenantId, input.data.classTeacherId);
    }

    const [classRow] = await tx
      .select({ order: classes.order })
      .from(classes)
      .where(and(
        eq(classes.id, section.classId),
        eq(classes.tenantId, input.tenantId),
        isNull(classes.deletedAt),
      ))
      .limit(1);
    if (!classRow) throw new NotFoundError('Class');

    const nextName = input.data.name ?? section.name;
    if (nextName !== section.name) {
      const [existing] = await tx
        .select({ id: sections.id })
        .from(sections)
        .where(and(
          eq(sections.classId, section.classId),
          eq(sections.tenantId, input.tenantId),
          eq(sections.name, nextName),
          isNull(sections.deletedAt),
        ))
        .limit(1);
      if (existing) throw new ConflictError('Section name already exists in this class');
    }

    const [updated] = await tx
      .update(sections)
      .set({
        name: nextName,
        fullName: `${classRow.order}-${nextName}`,
        ...(input.data.stream !== undefined ? { stream: input.data.stream } : {}),
        ...(input.data.capacity !== undefined ? { capacity: input.data.capacity } : {}),
        ...(input.data.classTeacherId !== undefined ? { classTeacherId: input.data.classTeacherId } : {}),
        useClassSubjects,
        updatedAt: new Date(),
      })
      .where(and(
        eq(sections.id, input.sectionId),
        eq(sections.tenantId, input.tenantId),
      ))
      .returning();
    if (!updated) throw new NotFoundError('Section');

    if (useClassSubjects) {
      await tx.delete(sectionSubjects).where(and(
        eq(sectionSubjects.tenantId, input.tenantId),
        eq(sectionSubjects.sectionId, input.sectionId),
      ));
    } else if (subjectIds !== undefined) {
      await tx.delete(sectionSubjects).where(and(
        eq(sectionSubjects.tenantId, input.tenantId),
        eq(sectionSubjects.sectionId, input.sectionId),
      ));
      if (subjectIds.length > 0) {
        await tx.insert(sectionSubjects).values(
          subjectIds.map((subjectId) => ({
            tenantId: input.tenantId,
            sectionId: input.sectionId,
            subjectId,
          })),
        );
      }
    }
    return updated;
  });
}

export async function deleteSection(sectionId: string, tenantId: string) {
  return db.transaction(async (tx) => {
    const [deleted] = await tx
      .update(sections)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(and(
        eq(sections.id, sectionId),
        eq(sections.tenantId, tenantId),
        isNull(sections.deletedAt),
      ))
      .returning({ id: sections.id });
    if (!deleted) throw new NotFoundError('Section');
    await tx.delete(sectionSubjects).where(and(
      eq(sectionSubjects.tenantId, tenantId),
      eq(sectionSubjects.sectionId, sectionId),
    ));
    await tx.delete(teacherAssignments).where(and(
      eq(teacherAssignments.tenantId, tenantId),
      eq(teacherAssignments.sectionId, sectionId),
    ));
  });
}

export async function setCustomSectionSubjects(
  sectionId: string,
  tenantId: string,
  subjectIds: string[],
) {
  const ids = [...new Set(subjectIds)];
  if (ids.length !== subjectIds.length) throw new BadRequestError('Duplicate subject IDs are not allowed');

  return db.transaction(async (tx) => {
    const [section] = await tx
      .select({ id: sections.id })
      .from(sections)
      .where(and(
        eq(sections.id, sectionId),
        eq(sections.tenantId, tenantId),
        isNull(sections.deletedAt),
      ))
      .for('update')
      .limit(1);
    if (!section) throw new NotFoundError('Section');

    if (ids.length > 0) {
      const validSubjects = await tx
        .select({ id: subjects.id })
        .from(subjects)
        .where(and(
          eq(subjects.tenantId, tenantId),
          inArray(subjects.id, ids),
          isNull(subjects.deletedAt),
        ));
      if (validSubjects.length !== ids.length) {
        throw new BadRequestError('Some subjects do not exist in this school');
      }
    }

    await tx.delete(sectionSubjects).where(and(
      eq(sectionSubjects.tenantId, tenantId),
      eq(sectionSubjects.sectionId, sectionId),
    ));
    if (ids.length > 0) {
      await tx.insert(sectionSubjects).values(
        ids.map((subjectId) => ({ tenantId, sectionId, subjectId })),
      );
    }
    await tx.update(sections)
      .set({ useClassSubjects: false, updatedAt: new Date() })
      .where(and(eq(sections.id, sectionId), eq(sections.tenantId, tenantId)));
    return { success: true, count: ids.length };
  });
}
