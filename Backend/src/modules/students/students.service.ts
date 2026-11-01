import { and, asc, desc, eq, ilike, isNull, or, sql } from 'drizzle-orm';
import { db } from '../../config/database.js';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../../lib/errors.js';
import { classes } from '../classes/classes.schema.js';
import { sections } from '../sections/sections.schema.js';
import {
  ensurePlacementForCurrentYear,
  getCurrentSessionYear,
} from '../session-years/session-years.service.js';
import { studentPlacements } from '../session-years/session-years.schema.js';
import { tenants } from '../tenants/tenants.schema.js';
import { students } from './students.schema.js';
import type {
  CreateStudentInput,
  ListStudentsFilters,
  StudentDetail,
  StudentListItem,
  UpdateStudentInput,
} from './students.types.js';

function asDateString(value: string | Date): string {
  if (typeof value === 'string') return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

function toListItem(row: {
  id: string;
  admissionNo: string;
  cardCode?: string | null;
  fullName: string;
  gender: string;
  dateOfBirth: string;
  phone: string | null;
  email: string | null;
  classId: string;
  sectionId: string;
  className: string | null;
  sectionName: string | null;
  guardianName: string;
  guardianPhone: string;
  status: string;
  admissionDate: string;
  createdAt: Date;
}): StudentListItem {
  return {
    id: row.id,
    admissionNo: row.admissionNo,
    cardCode: row.cardCode ?? row.admissionNo,
    fullName: row.fullName,
    gender: row.gender,
    dateOfBirth: asDateString(row.dateOfBirth),
    phone: row.phone,
    email: row.email,
    classId: row.classId,
    sectionId: row.sectionId,
    className: row.className ?? '',
    sectionName: row.sectionName ?? '',
    guardianName: row.guardianName,
    guardianPhone: row.guardianPhone,
    status: row.status,
    admissionDate: asDateString(row.admissionDate),
    createdAt: row.createdAt,
  };
}

async function requirePlacement(tenantId: string, classId: string, sectionId: string) {
  const [classRow] = await db
    .select({ id: classes.id })
    .from(classes)
    .where(
      and(eq(classes.id, classId), eq(classes.tenantId, tenantId), isNull(classes.deletedAt)),
    )
    .limit(1);
  if (!classRow) throw new BadRequestError('Class not found');

  const [sectionRow] = await db
    .select({ id: sections.id, classId: sections.classId })
    .from(sections)
    .where(
      and(
        eq(sections.id, sectionId),
        eq(sections.tenantId, tenantId),
        isNull(sections.deletedAt),
      ),
    )
    .limit(1);
  if (!sectionRow) throw new BadRequestError('Section not found');
  if (sectionRow.classId !== classId) {
    throw new BadRequestError('Section does not belong to the selected class');
  }
}

async function ensureAdmissionNoAvailable(
  tenantId: string,
  admissionNo: string,
  excludeId?: string,
) {
  const conditions = [
    eq(students.tenantId, tenantId),
    eq(students.admissionNo, admissionNo),
    isNull(students.deletedAt),
  ];
  if (excludeId) conditions.push(sql`${students.id} <> ${excludeId}`);

  const [existing] = await db
    .select({ id: students.id })
    .from(students)
    .where(and(...conditions))
    .limit(1);
  if (existing) throw new ConflictError('Admission number already exists');
}

async function generateAdmissionNo(tenantId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `ADM-${year}-`;
  const [row] = await db
    .select({
      count: sql<number>`count(*)::int`,
    })
    .from(students)
    .where(
      and(
        eq(students.tenantId, tenantId),
        ilike(students.admissionNo, `${prefix}%`),
      ),
    );
  const next = Number(row?.count ?? 0) + 1;
  return `${prefix}${String(next).padStart(4, '0')}`;
}

async function requireStudent(studentId: string, tenantId: string) {
  const [student] = await db
    .select()
    .from(students)
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

export async function listStudents(filters: ListStudentsFilters) {
  const { tenantId, page = 1, limit = 20, search, classId, sectionId, status } = filters;
  const conditions = [eq(students.tenantId, tenantId), isNull(students.deletedAt)];

  if (classId) conditions.push(eq(students.classId, classId));
  if (sectionId) conditions.push(eq(students.sectionId, sectionId));
  if (status) conditions.push(eq(students.status, status));
  if (search) {
    const escaped = `%${search.replace(/[\\%_]/g, '\\$&')}%`;
    const searchFilter = or(
      ilike(students.fullName, escaped),
      ilike(students.admissionNo, escaped),
      ilike(students.phone, escaped),
      ilike(students.guardianName, escaped),
      ilike(students.guardianPhone, escaped),
    );
    if (searchFilter) conditions.push(searchFilter);
  }

  const where = and(...conditions);
  const offset = (page - 1) * limit;

  const [rows, countRows] = await Promise.all([
    db
      .select({
        id: students.id,
        admissionNo: students.admissionNo,
        cardCode: students.cardCode,
        fullName: students.fullName,
        gender: students.gender,
        dateOfBirth: students.dateOfBirth,
        phone: students.phone,
        email: students.email,
        classId: students.classId,
        sectionId: students.sectionId,
        className: classes.name,
        sectionName: sections.name,
        guardianName: students.guardianName,
        guardianPhone: students.guardianPhone,
        status: students.status,
        admissionDate: students.admissionDate,
        createdAt: students.createdAt,
      })
      .from(students)
      .innerJoin(classes, eq(students.classId, classes.id))
      .innerJoin(sections, eq(students.sectionId, sections.id))
      .where(where)
      .orderBy(desc(students.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(students).where(where),
  ]);

  const total = countRows[0]?.count ?? 0;
  return {
    items: rows.map(toListItem),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
}

export async function getStudentById(
  studentId: string,
  tenantId: string,
): Promise<StudentDetail> {
  const [row] = await db
    .select({
      id: students.id,
      admissionNo: students.admissionNo,
      cardCode: students.cardCode,
      fullName: students.fullName,
      gender: students.gender,
      dateOfBirth: students.dateOfBirth,
      bloodGroup: students.bloodGroup,
      phone: students.phone,
      email: students.email,
      address: students.address,
      classId: students.classId,
      sectionId: students.sectionId,
      className: classes.name,
      sectionName: sections.name,
      guardianName: students.guardianName,
      guardianPhone: students.guardianPhone,
      guardianEmail: students.guardianEmail,
      guardianRelation: students.guardianRelation,
      status: students.status,
      admissionDate: students.admissionDate,
      notes: students.notes,
      createdAt: students.createdAt,
      updatedAt: students.updatedAt,
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

  if (!row) throw new NotFoundError('Student');

  return {
    ...toListItem(row),
    cardCode: row.cardCode ?? row.admissionNo,
    bloodGroup: row.bloodGroup,
    address: row.address,
    guardianEmail: row.guardianEmail,
    guardianRelation: row.guardianRelation,
    notes: row.notes,
    updatedAt: row.updatedAt,
  };
}

export async function createStudent(input: CreateStudentInput): Promise<StudentDetail> {
  const data = input.data;
  await requirePlacement(input.tenantId, data.classId, data.sectionId);

  const student = await db.transaction(async (tx) => {
    const [tenant] = await tx
      .select({
        maxStudents: tenants.maxStudents,
        status: tenants.status,
      })
      .from(tenants)
      .where(and(eq(tenants.id, input.tenantId), isNull(tenants.deletedAt)))
      .for('update')
      .limit(1);
    if (!tenant) throw new NotFoundError('School');
    if (tenant.status === 'suspended' || tenant.status === 'cancelled') {
      throw new ForbiddenError('School is not active');
    }

    const [countRow] = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(students)
      .where(
        and(
          eq(students.tenantId, input.tenantId),
          isNull(students.deletedAt),
          eq(students.status, 'active'),
        ),
      );
    if (Number(countRow?.count ?? 0) >= tenant.maxStudents) {
      throw new ForbiddenError(
        `Student limit reached (${tenant.maxStudents}). Upgrade the school plan to add more students.`,
      );
    }

    const admissionNo = (data.admissionNo?.trim() || (await generateAdmissionNo(input.tenantId))).toUpperCase();

    const [existing] = await tx
      .select({ id: students.id })
      .from(students)
      .where(
        and(
          eq(students.tenantId, input.tenantId),
          eq(students.admissionNo, admissionNo),
          isNull(students.deletedAt),
        ),
      )
      .limit(1);
    if (existing) throw new ConflictError('Admission number already exists');

    const today = new Date().toISOString().slice(0, 10);
    const [created] = await tx
      .insert(students)
      .values({
        tenantId: input.tenantId,
        admissionNo,
        cardCode: admissionNo,
        fullName: data.fullName.trim(),
        gender: data.gender,
        dateOfBirth: data.dateOfBirth,
        bloodGroup: data.bloodGroup || null,
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
        classId: data.classId,
        sectionId: data.sectionId,
        guardianName: data.guardianName.trim(),
        guardianPhone: data.guardianPhone.trim(),
        guardianEmail: data.guardianEmail || null,
        guardianRelation: data.guardianRelation || null,
        status: data.status ?? 'active',
        admissionDate: data.admissionDate ?? today,
        notes: data.notes || null,
      })
      .returning({ id: students.id });

    if (!created) throw new BadRequestError('Could not create student');
    return created;
  });

  await ensurePlacementForCurrentYear({
    tenantId: input.tenantId,
    studentId: student.id,
    classId: data.classId,
    sectionId: data.sectionId,
  });

  return getStudentById(student.id, input.tenantId);
}

export async function updateStudent(input: UpdateStudentInput): Promise<StudentDetail> {
  const existing = await requireStudent(input.studentId, input.tenantId);
  const data = input.data;

  const nextClassId = data.classId ?? existing.classId;
  const nextSectionId = data.sectionId ?? existing.sectionId;
  if (data.classId || data.sectionId) {
    await requirePlacement(input.tenantId, nextClassId, nextSectionId);
  }

  if (data.admissionNo && data.admissionNo.trim().toUpperCase() !== existing.admissionNo) {
    await ensureAdmissionNoAvailable(
      input.tenantId,
      data.admissionNo.trim().toUpperCase(),
      existing.id,
    );
  }

  const nextAdmission =
    data.admissionNo !== undefined
      ? data.admissionNo.trim().toUpperCase()
      : existing.admissionNo;
  const shouldSyncCardCode =
    data.admissionNo !== undefined &&
    (!existing.cardCode || existing.cardCode === existing.admissionNo);

  const [updated] = await db
    .update(students)
    .set({
      ...(data.admissionNo !== undefined ? { admissionNo: nextAdmission } : {}),
      ...(shouldSyncCardCode ? { cardCode: nextAdmission } : {}),
      ...(data.fullName !== undefined ? { fullName: data.fullName.trim() } : {}),
      ...(data.gender !== undefined ? { gender: data.gender } : {}),
      ...(data.dateOfBirth !== undefined ? { dateOfBirth: data.dateOfBirth } : {}),
      ...(data.bloodGroup !== undefined ? { bloodGroup: data.bloodGroup || null } : {}),
      ...(data.phone !== undefined ? { phone: data.phone || null } : {}),
      ...(data.email !== undefined ? { email: data.email || null } : {}),
      ...(data.address !== undefined ? { address: data.address || null } : {}),
      ...(data.classId !== undefined ? { classId: data.classId } : {}),
      ...(data.sectionId !== undefined ? { sectionId: data.sectionId } : {}),
      ...(data.guardianName !== undefined ? { guardianName: data.guardianName.trim() } : {}),
      ...(data.guardianPhone !== undefined ? { guardianPhone: data.guardianPhone.trim() } : {}),
      ...(data.guardianEmail !== undefined
        ? { guardianEmail: data.guardianEmail || null }
        : {}),
      ...(data.guardianRelation !== undefined
        ? { guardianRelation: data.guardianRelation || null }
        : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.admissionDate !== undefined ? { admissionDate: data.admissionDate } : {}),
      ...(data.notes !== undefined ? { notes: data.notes || null } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(students.id, existing.id), eq(students.tenantId, input.tenantId)))
    .returning({ id: students.id });

  if (!updated) throw new NotFoundError('Student');

  if (data.classId !== undefined || data.sectionId !== undefined) {
    const current = await getCurrentSessionYear(input.tenantId);
    if (current) {
      const [placement] = await db
        .select({ id: studentPlacements.id })
        .from(studentPlacements)
        .where(
          and(
            eq(studentPlacements.studentId, existing.id),
            eq(studentPlacements.sessionYearId, current.id),
          ),
        )
        .limit(1);
      if (placement) {
        await db
          .update(studentPlacements)
          .set({
            classId: nextClassId,
            sectionId: nextSectionId,
            updatedAt: new Date(),
          })
          .where(eq(studentPlacements.id, placement.id));
      } else {
        await ensurePlacementForCurrentYear({
          tenantId: input.tenantId,
          studentId: existing.id,
          classId: nextClassId,
          sectionId: nextSectionId,
        });
      }
    }
  }

  return getStudentById(updated.id, input.tenantId);
}

export async function deleteStudent(studentId: string, tenantId: string) {
  const existing = await requireStudent(studentId, tenantId);
  await db
    .update(students)
    .set({ deletedAt: new Date(), status: 'inactive', updatedAt: new Date() })
    .where(and(eq(students.id, existing.id), eq(students.tenantId, tenantId)));
}

export async function listIdCardStudents(input: {
  tenantId: string;
  classId?: string;
  sectionId?: string;
}) {
  await db.execute(sql`
    UPDATE students
    SET card_code = admission_no, updated_at = NOW()
    WHERE tenant_id = ${input.tenantId}
      AND deleted_at IS NULL
      AND (card_code IS NULL OR card_code = '')
  `);

  const conditions = [
    eq(students.tenantId, input.tenantId),
    isNull(students.deletedAt),
    eq(students.status, 'active'),
  ];
  if (input.classId) conditions.push(eq(students.classId, input.classId));
  if (input.sectionId) conditions.push(eq(students.sectionId, input.sectionId));

  const [tenant] = await db
    .select({
      name: tenants.name,
      city: tenants.city,
      address: tenants.address,
      logoUrl: tenants.logoUrl,
    })
    .from(tenants)
    .where(eq(tenants.id, input.tenantId))
    .limit(1);

  const rows = await db
    .select({
      id: students.id,
      fullName: students.fullName,
      admissionNo: students.admissionNo,
      cardCode: students.cardCode,
      gender: students.gender,
      dateOfBirth: students.dateOfBirth,
      className: classes.name,
      sectionName: sections.name,
      guardianName: students.guardianName,
    })
    .from(students)
    .innerJoin(classes, eq(students.classId, classes.id))
    .innerJoin(sections, eq(students.sectionId, sections.id))
    .where(and(...conditions))
    .orderBy(asc(classes.name), asc(sections.name), asc(students.fullName))
    .limit(500);

  return {
    school: {
      name: tenant?.name ?? 'School',
      city: tenant?.city ?? null,
      address: tenant?.address ?? null,
      logoUrl: tenant?.logoUrl ?? null,
    },
    cards: rows.map((row) => ({
      id: row.id,
      fullName: row.fullName,
      admissionNo: row.admissionNo,
      cardCode: row.cardCode ?? row.admissionNo,
      gender: row.gender,
      dateOfBirth: String(row.dateOfBirth).slice(0, 10),
      className: row.className,
      sectionName: row.sectionName,
      guardianName: row.guardianName,
    })),
  };
}
