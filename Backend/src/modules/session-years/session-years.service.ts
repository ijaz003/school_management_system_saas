import { and, asc, desc, eq, inArray, isNull, ne } from 'drizzle-orm';
import { db } from '../../config/database.js';
import { BadRequestError, ConflictError, NotFoundError } from '../../lib/errors.js';
import { classes } from '../classes/classes.schema.js';
import { sections } from '../sections/sections.schema.js';
import { students } from '../students/students.schema.js';
import { tenants } from '../tenants/tenants.schema.js';
import { sessionYears, studentPlacements } from './session-years.schema.js';
import type {
  CreateSessionYearData,
  PromoteStudentsInput,
  UpdateSessionYearData,
} from './session-years.types.js';

function mapSessionYear(row: typeof sessionYears.$inferSelect, currentId: string | null) {
  return {
    id: row.id,
    name: row.name,
    startDate: row.startDate,
    endDate: row.endDate,
    status: row.status,
    isCurrent: currentId === row.id,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function getCurrentSessionYearId(tenantId: string): Promise<string | null> {
  const [tenant] = await db
    .select({ settings: tenants.settings })
    .from(tenants)
    .where(and(eq(tenants.id, tenantId), isNull(tenants.deletedAt)))
    .limit(1);
  return tenant?.settings?.currentSessionYearId ?? null;
}

async function requireSessionYear(id: string, tenantId: string) {
  const [row] = await db
    .select()
    .from(sessionYears)
    .where(
      and(
        eq(sessionYears.id, id),
        eq(sessionYears.tenantId, tenantId),
        isNull(sessionYears.deletedAt),
      ),
    )
    .limit(1);
  if (!row) throw new NotFoundError('Session year');
  return row;
}

async function setCurrentSessionYear(tenantId: string, sessionYearId: string, name: string) {
  const [tenant] = await db
    .select({ settings: tenants.settings })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  await db
    .update(tenants)
    .set({
      settings: {
        ...(tenant?.settings ?? {}),
        currentSessionYearId: sessionYearId,
        academicYear: name,
      },
      updatedAt: new Date(),
    })
    .where(eq(tenants.id, tenantId));

  await db
    .update(sessionYears)
    .set({ status: 'planned', updatedAt: new Date() })
    .where(
      and(
        eq(sessionYears.tenantId, tenantId),
        eq(sessionYears.status, 'active'),
        ne(sessionYears.id, sessionYearId),
        isNull(sessionYears.deletedAt),
      ),
    );

  await db
    .update(sessionYears)
    .set({ status: 'active', updatedAt: new Date() })
    .where(and(eq(sessionYears.id, sessionYearId), eq(sessionYears.tenantId, tenantId)));
}

export async function listSessionYears(tenantId: string) {
  const currentId = await getCurrentSessionYearId(tenantId);
  const rows = await db
    .select()
    .from(sessionYears)
    .where(and(eq(sessionYears.tenantId, tenantId), isNull(sessionYears.deletedAt)))
    .orderBy(desc(sessionYears.startDate));
  return rows.map((row) => mapSessionYear(row, currentId));
}

export async function getSessionYearById(id: string, tenantId: string) {
  const currentId = await getCurrentSessionYearId(tenantId);
  const row = await requireSessionYear(id, tenantId);
  return mapSessionYear(row, currentId);
}

export async function createSessionYear(tenantId: string, data: CreateSessionYearData) {
  const name = data.name.trim();
  const [dup] = await db
    .select({ id: sessionYears.id })
    .from(sessionYears)
    .where(
      and(
        eq(sessionYears.tenantId, tenantId),
        eq(sessionYears.name, name),
        isNull(sessionYears.deletedAt),
      ),
    )
    .limit(1);
  if (dup) throw new ConflictError('A session year with this name already exists');

  const status = data.setAsCurrent ? 'active' : (data.status ?? 'planned');
  const [created] = await db
    .insert(sessionYears)
    .values({
      tenantId,
      name,
      startDate: data.startDate,
      endDate: data.endDate,
      status,
    })
    .returning();
  if (!created) throw new BadRequestError('Could not create session year');

  if (data.setAsCurrent || status === 'active') {
    await setCurrentSessionYear(tenantId, created.id, created.name);
  }

  return getSessionYearById(created.id, tenantId);
}

export async function updateSessionYear(
  id: string,
  tenantId: string,
  data: UpdateSessionYearData,
) {
  const existing = await requireSessionYear(id, tenantId);
  if (data.name && data.name.trim() !== existing.name) {
    const [dup] = await db
      .select({ id: sessionYears.id })
      .from(sessionYears)
      .where(
        and(
          eq(sessionYears.tenantId, tenantId),
          eq(sessionYears.name, data.name.trim()),
          isNull(sessionYears.deletedAt),
          ne(sessionYears.id, id),
        ),
      )
      .limit(1);
    if (dup) throw new ConflictError('A session year with this name already exists');
  }

  const startDate = data.startDate ?? existing.startDate;
  const endDate = data.endDate ?? existing.endDate;
  if (endDate < startDate) {
    throw new BadRequestError('End date must be on or after start date');
  }

  await db
    .update(sessionYears)
    .set({
      ...(data.name !== undefined ? { name: data.name.trim() } : {}),
      ...(data.startDate !== undefined ? { startDate: data.startDate } : {}),
      ...(data.endDate !== undefined ? { endDate: data.endDate } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(sessionYears.id, id), eq(sessionYears.tenantId, tenantId)));

  if (data.status === 'active') {
    const name = data.name?.trim() ?? existing.name;
    await setCurrentSessionYear(tenantId, id, name);
  } else if (data.name) {
    const currentId = await getCurrentSessionYearId(tenantId);
    if (currentId === id) {
      const [tenant] = await db
        .select({ settings: tenants.settings })
        .from(tenants)
        .where(eq(tenants.id, tenantId))
        .limit(1);
      await db
        .update(tenants)
        .set({
          settings: {
            ...(tenant?.settings ?? {}),
            academicYear: data.name.trim(),
            currentSessionYearId: id,
          },
          updatedAt: new Date(),
        })
        .where(eq(tenants.id, tenantId));
    }
  }

  return getSessionYearById(id, tenantId);
}

export async function setSessionYearCurrent(id: string, tenantId: string) {
  const row = await requireSessionYear(id, tenantId);
  await setCurrentSessionYear(tenantId, row.id, row.name);
  return getSessionYearById(id, tenantId);
}

export async function deleteSessionYear(id: string, tenantId: string) {
  const row = await requireSessionYear(id, tenantId);
  const currentId = await getCurrentSessionYearId(tenantId);
  if (currentId === row.id) {
    throw new BadRequestError('Cannot delete the current session year. Set another year as current first.');
  }

  const [placement] = await db
    .select({ id: studentPlacements.id })
    .from(studentPlacements)
    .where(
      and(
        eq(studentPlacements.sessionYearId, id),
        eq(studentPlacements.tenantId, tenantId),
      ),
    )
    .limit(1);
  if (placement) {
    throw new BadRequestError('Cannot delete a session year that has student placements');
  }

  await db
    .update(sessionYears)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(sessionYears.id, id), eq(sessionYears.tenantId, tenantId)));
}

/** Ensure a placement row exists for the student's live class/section in a session year. */
export async function ensureStudentPlacement(input: {
  tenantId: string;
  studentId: string;
  sessionYearId: string;
  classId: string;
  sectionId: string;
}) {
  const [existing] = await db
    .select({ id: studentPlacements.id })
    .from(studentPlacements)
    .where(
      and(
        eq(studentPlacements.studentId, input.studentId),
        eq(studentPlacements.sessionYearId, input.sessionYearId),
      ),
    )
    .limit(1);
  if (existing) return existing.id;

  await db
    .update(studentPlacements)
    .set({ isCurrent: false, updatedAt: new Date() })
    .where(
      and(
        eq(studentPlacements.studentId, input.studentId),
        eq(studentPlacements.isCurrent, true),
      ),
    );

  const [created] = await db
    .insert(studentPlacements)
    .values({
      tenantId: input.tenantId,
      studentId: input.studentId,
      sessionYearId: input.sessionYearId,
      classId: input.classId,
      sectionId: input.sectionId,
      status: 'enrolled',
      isCurrent: true,
    })
    .returning({ id: studentPlacements.id });

  return created?.id ?? null;
}

export async function ensurePlacementForCurrentYear(input: {
  tenantId: string;
  studentId: string;
  classId: string;
  sectionId: string;
}) {
  const currentId = await getCurrentSessionYearId(input.tenantId);
  if (!currentId) return null;
  return ensureStudentPlacement({ ...input, sessionYearId: currentId });
}

export async function listPlacements(
  tenantId: string,
  filters: { sessionYearId?: string; classId?: string; studentId?: string },
) {
  const conditions = [eq(studentPlacements.tenantId, tenantId)];
  if (filters.sessionYearId) {
    conditions.push(eq(studentPlacements.sessionYearId, filters.sessionYearId));
  }
  if (filters.classId) conditions.push(eq(studentPlacements.classId, filters.classId));
  if (filters.studentId) conditions.push(eq(studentPlacements.studentId, filters.studentId));

  const rows = await db
    .select({
      id: studentPlacements.id,
      studentId: studentPlacements.studentId,
      studentName: students.fullName,
      admissionNo: students.admissionNo,
      sessionYearId: studentPlacements.sessionYearId,
      sessionYearName: sessionYears.name,
      classId: studentPlacements.classId,
      className: classes.name,
      sectionId: studentPlacements.sectionId,
      sectionName: sections.name,
      status: studentPlacements.status,
      isCurrent: studentPlacements.isCurrent,
      createdAt: studentPlacements.createdAt,
    })
    .from(studentPlacements)
    .innerJoin(students, eq(studentPlacements.studentId, students.id))
    .innerJoin(sessionYears, eq(studentPlacements.sessionYearId, sessionYears.id))
    .innerJoin(classes, eq(studentPlacements.classId, classes.id))
    .innerJoin(sections, eq(studentPlacements.sectionId, sections.id))
    .where(and(...conditions))
    .orderBy(asc(classes.order), asc(sections.name), asc(students.fullName))
    .limit(2000);

  return rows;
}

export async function getPromotionPreview(input: {
  tenantId: string;
  fromSessionYearId: string;
  fromClassId: string;
  toClassId?: string;
}) {
  await requireSessionYear(input.fromSessionYearId, input.tenantId);

  const [fromClass] = await db
    .select()
    .from(classes)
    .where(
      and(
        eq(classes.id, input.fromClassId),
        eq(classes.tenantId, input.tenantId),
        isNull(classes.deletedAt),
      ),
    )
    .limit(1);
  if (!fromClass) throw new NotFoundError('Class');

  const [nextClass] = await db
    .select()
    .from(classes)
    .where(
      and(
        eq(classes.tenantId, input.tenantId),
        eq(classes.order, fromClass.order + 1),
        isNull(classes.deletedAt),
      ),
    )
    .orderBy(asc(classes.name))
    .limit(1);

  let targetClass = nextClass;
  if (input.toClassId) {
    const [chosen] = await db
      .select()
      .from(classes)
      .where(
        and(
          eq(classes.id, input.toClassId),
          eq(classes.tenantId, input.tenantId),
          isNull(classes.deletedAt),
        ),
      )
      .limit(1);
    if (!chosen) throw new NotFoundError('Target class');
    targetClass = chosen;
  }

  const fromSections = await db
    .select({ id: sections.id, name: sections.name })
    .from(sections)
    .where(
      and(
        eq(sections.classId, fromClass.id),
        eq(sections.tenantId, input.tenantId),
        isNull(sections.deletedAt),
      ),
    )
    .orderBy(asc(sections.name));

  const toSections = targetClass
    ? await db
        .select({ id: sections.id, name: sections.name })
        .from(sections)
        .where(
          and(
            eq(sections.classId, targetClass.id),
            eq(sections.tenantId, input.tenantId),
            isNull(sections.deletedAt),
          ),
        )
        .orderBy(asc(sections.name))
    : [];

  const studentRows = await db
    .select({
      id: students.id,
      fullName: students.fullName,
      admissionNo: students.admissionNo,
      sectionId: students.sectionId,
      sectionName: sections.name,
    })
    .from(students)
    .innerJoin(sections, eq(students.sectionId, sections.id))
    .where(
      and(
        eq(students.tenantId, input.tenantId),
        eq(students.classId, input.fromClassId),
        eq(students.status, 'active'),
        isNull(students.deletedAt),
      ),
    )
    .orderBy(asc(sections.name), asc(students.fullName));

  return {
    fromClass: { id: fromClass.id, name: fromClass.name, order: fromClass.order },
    nextClass: nextClass
      ? { id: nextClass.id, name: nextClass.name, order: nextClass.order }
      : null,
    targetClass: targetClass
      ? { id: targetClass.id, name: targetClass.name, order: targetClass.order }
      : null,
    fromSections,
    toSections,
    students: studentRows,
  };
}

export async function promoteStudents(tenantId: string, input: PromoteStudentsInput) {
  if (input.fromSessionYearId === input.toSessionYearId) {
    throw new BadRequestError('From and to session years must be different');
  }

  const fromYear = await requireSessionYear(input.fromSessionYearId, tenantId);
  const toYear = await requireSessionYear(input.toSessionYearId, tenantId);
  if (toYear.status === 'closed') {
    throw new BadRequestError('Cannot promote into a closed session year');
  }

  const [fromClass] = await db
    .select()
    .from(classes)
    .where(
      and(
        eq(classes.id, input.fromClassId),
        eq(classes.tenantId, tenantId),
        isNull(classes.deletedAt),
      ),
    )
    .limit(1);
  if (!fromClass) throw new NotFoundError('Source class');

  let toClassId = input.toClassId;
  if (!toClassId) {
    const [nextClass] = await db
      .select({ id: classes.id })
      .from(classes)
      .where(
        and(
          eq(classes.tenantId, tenantId),
          eq(classes.order, fromClass.order + 1),
          isNull(classes.deletedAt),
        ),
      )
      .limit(1);
    toClassId = nextClass?.id;
  }

  const retainSet = new Set(input.retainStudentIds ?? []);
  const graduateSet = new Set(input.graduateStudentIds ?? []);

  const studentConditions = [
    eq(students.tenantId, tenantId),
    eq(students.classId, input.fromClassId),
    eq(students.status, 'active'),
    isNull(students.deletedAt),
  ];
  if (input.studentIds?.length) {
    studentConditions.push(inArray(students.id, input.studentIds));
  }

  const candidates = await db
    .select({
      id: students.id,
      fullName: students.fullName,
      admissionNo: students.admissionNo,
      sectionId: students.sectionId,
      classId: students.classId,
    })
    .from(students)
    .where(and(...studentConditions));

  if (candidates.length === 0) {
    throw new BadRequestError('No students found to promote');
  }

  const fromSectionRows = await db
    .select({ id: sections.id, name: sections.name })
    .from(sections)
    .where(
      and(
        eq(sections.classId, input.fromClassId),
        eq(sections.tenantId, tenantId),
        isNull(sections.deletedAt),
      ),
    );

  const toSectionRows = toClassId
    ? await db
        .select({ id: sections.id, name: sections.name, classId: sections.classId })
        .from(sections)
        .where(
          and(
            eq(sections.classId, toClassId),
            eq(sections.tenantId, tenantId),
            isNull(sections.deletedAt),
          ),
        )
    : [];

  const sectionByName = new Map(
    toSectionRows.map((row) => [row.name.trim().toLowerCase(), row]),
  );

  const results = {
    promoted: [] as Array<{ studentId: string; admissionNo: string; fullName: string }>,
    retained: [] as Array<{ studentId: string; admissionNo: string; fullName: string }>,
    graduated: [] as Array<{ studentId: string; admissionNo: string; fullName: string }>,
    errors: [] as Array<{ studentId: string; admissionNo: string; message: string }>,
  };

  for (const student of candidates) {
    try {
      await db.transaction(async (tx) => {
        let fromPlacement = (
          await tx
            .select()
            .from(studentPlacements)
            .where(
              and(
                eq(studentPlacements.studentId, student.id),
                eq(studentPlacements.sessionYearId, fromYear.id),
              ),
            )
            .limit(1)
        )[0];

        if (!fromPlacement) {
          const [created] = await tx
            .insert(studentPlacements)
            .values({
              tenantId,
              studentId: student.id,
              sessionYearId: fromYear.id,
              classId: student.classId,
              sectionId: student.sectionId,
              status: 'enrolled',
              isCurrent: true,
            })
            .returning();
          fromPlacement = created!;
        }

        const [existingTarget] = await tx
          .select({ id: studentPlacements.id })
          .from(studentPlacements)
          .where(
            and(
              eq(studentPlacements.studentId, student.id),
              eq(studentPlacements.sessionYearId, toYear.id),
            ),
          )
          .limit(1);
        if (existingTarget) {
          throw new ConflictError('Student already has a placement in the target session year');
        }

        if (graduateSet.has(student.id)) {
          await tx
            .update(studentPlacements)
            .set({
              status: 'graduated',
              isCurrent: false,
              updatedAt: new Date(),
            })
            .where(eq(studentPlacements.id, fromPlacement.id));

          await tx
            .update(students)
            .set({ status: 'alumni', updatedAt: new Date() })
            .where(eq(students.id, student.id));

          results.graduated.push({
            studentId: student.id,
            admissionNo: student.admissionNo,
            fullName: student.fullName,
          });
          return;
        }

        if (retainSet.has(student.id) || !toClassId) {
          const keepClassId = student.classId;
          const keepSectionId = student.sectionId;

          await tx
            .update(studentPlacements)
            .set({
              status: 'retained',
              isCurrent: false,
              updatedAt: new Date(),
            })
            .where(eq(studentPlacements.id, fromPlacement.id));

          await tx
            .update(studentPlacements)
            .set({ isCurrent: false, updatedAt: new Date() })
            .where(
              and(
                eq(studentPlacements.studentId, student.id),
                eq(studentPlacements.isCurrent, true),
              ),
            );

          await tx.insert(studentPlacements).values({
            tenantId,
            studentId: student.id,
            sessionYearId: toYear.id,
            classId: keepClassId,
            sectionId: keepSectionId,
            status: 'enrolled',
            isCurrent: true,
            promotedFromPlacementId: fromPlacement.id,
            notes: !toClassId ? 'Retained — no next class in ladder' : 'Retained in same class',
          });

          results.retained.push({
            studentId: student.id,
            admissionNo: student.admissionNo,
            fullName: student.fullName,
          });
          return;
        }

        const mappedSectionId = input.sectionMap?.[student.sectionId];
        let targetSectionId = mappedSectionId;
        if (!targetSectionId) {
          const fromSection = fromSectionRows.find((row) => row.id === student.sectionId);
          const match = fromSection
            ? sectionByName.get(fromSection.name.trim().toLowerCase())
            : undefined;
          targetSectionId = match?.id ?? toSectionRows[0]?.id;
        }
        if (!targetSectionId) {
          throw new BadRequestError('No target section available for promotion');
        }

        const targetOk = toSectionRows.some((row) => row.id === targetSectionId);
        if (!targetOk) {
          throw new BadRequestError('Target section does not belong to the destination class');
        }

        await tx
          .update(studentPlacements)
          .set({
            status: 'promoted',
            isCurrent: false,
            updatedAt: new Date(),
          })
          .where(eq(studentPlacements.id, fromPlacement.id));

        await tx
          .update(studentPlacements)
          .set({ isCurrent: false, updatedAt: new Date() })
          .where(
            and(
              eq(studentPlacements.studentId, student.id),
              eq(studentPlacements.isCurrent, true),
            ),
          );

        await tx.insert(studentPlacements).values({
          tenantId,
          studentId: student.id,
          sessionYearId: toYear.id,
          classId: toClassId,
          sectionId: targetSectionId,
          status: 'enrolled',
          isCurrent: true,
          promotedFromPlacementId: fromPlacement.id,
        });

        await tx
          .update(students)
          .set({
            classId: toClassId,
            sectionId: targetSectionId,
            updatedAt: new Date(),
          })
          .where(eq(students.id, student.id));

        results.promoted.push({
          studentId: student.id,
          admissionNo: student.admissionNo,
          fullName: student.fullName,
        });
      });
    } catch (error) {
      results.errors.push({
        studentId: student.id,
        admissionNo: student.admissionNo,
        message: error instanceof Error ? error.message : 'Promotion failed',
      });
    }
  }

  return {
    fromSessionYear: { id: fromYear.id, name: fromYear.name },
    toSessionYear: { id: toYear.id, name: toYear.name },
    counts: {
      promoted: results.promoted.length,
      retained: results.retained.length,
      graduated: results.graduated.length,
      failed: results.errors.length,
    },
    ...results,
  };
}

export async function getCurrentSessionYear(tenantId: string) {
  const currentId = await getCurrentSessionYearId(tenantId);
  if (!currentId) return null;
  return getSessionYearById(currentId, tenantId);
}
