import { and, desc, eq, ilike, inArray, isNull, or, sql } from 'drizzle-orm';
import { db } from '../../config/database.js';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../../lib/errors.js';
import {
  canGrantPermissions,
  expandWildcards,
  hasPermission,
  isReservedPermission,
} from '../../lib/permissions.js';
import { generateRandomPassword, hashPassword } from '../../lib/password.js';
import { users } from '../auth/auth.schema.js';
import { classes } from '../classes/classes.schema.js';
import { permissions, roles } from '../roles/roles.schema.js';
import { sections } from '../sections/sections.schema.js';
import { students } from '../students/students.schema.js';
import { tenants } from '../tenants/tenants.schema.js';
import { parentStudents } from './parents.schema.js';
import type {
  CreateParentData,
  ListParentsFilters,
  UpdateParentData,
} from './parents.types.js';

async function getParentSystemRole() {
  const [role] = await db
    .select()
    .from(roles)
    .where(
      and(
        isNull(roles.tenantId),
        eq(roles.name, 'parent'),
        isNull(roles.deletedAt),
      ),
    )
    .limit(1);
  if (!role) throw new NotFoundError('Parent role');
  return role;
}

async function resolveParentPermissions(
  rolePermissions: string[],
  tenantPermissions: string[],
  adminPermissions: string[],
) {
  const availableRows = await db
    .select({ key: permissions.key })
    .from(permissions)
    .where(
      and(
        eq(permissions.isActive, true),
        eq(permissions.isAssignableToSchools, true),
      ),
    );
  const availableKeys = availableRows
    .map(({ key }) => key)
    .filter((key) => !isReservedPermission(key));
  const expanded = expandWildcards(rolePermissions, availableKeys);
  const unavailable = expanded.filter(
    (permission) => !hasPermission(tenantPermissions, permission),
  );
  if (unavailable.length > 0) {
    throw new ForbiddenError(
      `Parent permissions unavailable on this plan: ${unavailable.join(', ')}`,
    );
  }
  const grantCheck = canGrantPermissions(adminPermissions, expanded);
  if (!grantCheck.allowed) {
    throw new ForbiddenError(
      `You cannot create parents; missing: ${grantCheck.forbidden.join(', ')}`,
    );
  }
  return rolePermissions;
}

async function requireParentUser(parentId: string, tenantId: string) {
  const [parent] = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.id, parentId),
        eq(users.tenantId, tenantId),
        eq(users.role, 'parent'),
        isNull(users.deletedAt),
      ),
    )
    .limit(1);
  if (!parent) throw new NotFoundError('Parent');
  return parent;
}

async function requireStudents(studentIds: string[], tenantId: string) {
  if (studentIds.length === 0) return [];
  const rows = await db
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
        eq(students.tenantId, tenantId),
        inArray(students.id, studentIds),
        isNull(students.deletedAt),
      ),
    );
  if (rows.length !== studentIds.length) {
    throw new BadRequestError('One or more students were not found');
  }
  return rows;
}

async function listLinkedStudents(parentUserId: string, tenantId: string) {
  return db
    .select({
      id: students.id,
      fullName: students.fullName,
      admissionNo: students.admissionNo,
      classId: students.classId,
      sectionId: students.sectionId,
      className: classes.name,
      sectionName: sections.name,
      status: students.status,
      linkedAt: parentStudents.createdAt,
    })
    .from(parentStudents)
    .innerJoin(students, eq(parentStudents.studentId, students.id))
    .innerJoin(classes, eq(students.classId, classes.id))
    .innerJoin(sections, eq(students.sectionId, sections.id))
    .where(
      and(
        eq(parentStudents.tenantId, tenantId),
        eq(parentStudents.parentUserId, parentUserId),
        isNull(parentStudents.deletedAt),
        isNull(students.deletedAt),
      ),
    )
    .orderBy(students.fullName);
}

function mapParent(
  row: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  },
  children: Awaited<ReturnType<typeof listLinkedStudents>>,
) {
  return {
    id: row.id,
    fullName: row.fullName,
    email: row.email,
    phone: row.phone,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    children,
    childrenCount: children.length,
  };
}

export async function listParents(filters: ListParentsFilters) {
  const { tenantId, page = 1, limit = 20, search, isActive } = filters;
  const conditions = [
    eq(users.tenantId, tenantId),
    eq(users.role, 'parent'),
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
  const [rows, countRows] = await Promise.all([
    db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        phone: users.phone,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(where)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(users).where(where),
  ]);

  const items = await Promise.all(
    rows.map(async (row) => mapParent(row, await listLinkedStudents(row.id, tenantId))),
  );

  const total = countRows[0]?.count ?? 0;
  return {
    items,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
}

export async function getParent(parentId: string, tenantId: string) {
  const parent = await requireParentUser(parentId, tenantId);
  const children = await listLinkedStudents(parent.id, tenantId);
  return mapParent(parent, children);
}

export async function createParent(input: {
  tenantId: string;
  createdBy: string;
  adminPermissions: string[];
  data: CreateParentData;
}) {
  const email = input.data.email.trim().toLowerCase();
  const role = await getParentSystemRole();

  const [tenant] = await db
    .select({
      status: tenants.status,
      allowedPermissions: tenants.allowedPermissions,
    })
    .from(tenants)
    .where(and(eq(tenants.id, input.tenantId), isNull(tenants.deletedAt)))
    .limit(1);
  if (!tenant) throw new NotFoundError('School');
  if (tenant.status === 'suspended' || tenant.status === 'cancelled') {
    throw new ForbiddenError('School is not active');
  }

  const parentPermissions = await resolveParentPermissions(
    role.permissions,
    tenant.allowedPermissions,
    input.adminPermissions,
  );

  const studentIds = [...new Set(input.data.studentIds ?? [])];
  if (studentIds.length > 0) {
    await requireStudents(studentIds, input.tenantId);
  }

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.email, email), eq(users.tenantId, input.tenantId)))
    .limit(1);
  if (existing) throw new ConflictError('Email already registered in this school');

  const tempPassword = generateRandomPassword(12);
  const passwordHash = await hashPassword(tempPassword);

  const created = await db.transaction(async (tx) => {
    const [parent] = await tx
      .insert(users)
      .values({
        tenantId: input.tenantId,
        email,
        phone: input.data.phone?.trim() || null,
        passwordHash,
        fullName: input.data.fullName.trim(),
        role: 'parent',
        roleId: role.id,
        permissions: parentPermissions,
        isActive: true,
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
        metadata: { createdBy: input.createdBy, portal: 'parent' },
      })
      .returning();
    if (!parent) throw new BadRequestError('Could not create parent');

    if (studentIds.length > 0) {
      await tx.insert(parentStudents).values(
        studentIds.map((studentId) => ({
          tenantId: input.tenantId,
          parentUserId: parent.id,
          studentId,
        })),
      );
    }

    return parent;
  });

  return {
    parent: await getParent(created.id, input.tenantId),
    tempPassword,
  };
}

export async function updateParent(input: {
  parentId: string;
  tenantId: string;
  data: UpdateParentData;
}) {
  const parent = await requireParentUser(input.parentId, input.tenantId);
  await db
    .update(users)
    .set({
      ...(input.data.fullName !== undefined
        ? { fullName: input.data.fullName.trim() }
        : {}),
      ...(input.data.phone !== undefined
        ? { phone: input.data.phone?.trim() || null }
        : {}),
      ...(input.data.isActive !== undefined ? { isActive: input.data.isActive } : {}),
      updatedAt: new Date(),
    })
    .where(eq(users.id, parent.id));
  return getParent(parent.id, input.tenantId);
}

export async function linkStudents(input: {
  parentId: string;
  tenantId: string;
  studentIds: string[];
}) {
  const parent = await requireParentUser(input.parentId, input.tenantId);
  const studentIds = [...new Set(input.studentIds)];
  await requireStudents(studentIds, input.tenantId);

  const existing = await db
    .select({ studentId: parentStudents.studentId })
    .from(parentStudents)
    .where(
      and(
        eq(parentStudents.parentUserId, parent.id),
        inArray(parentStudents.studentId, studentIds),
        isNull(parentStudents.deletedAt),
      ),
    );
  const existingIds = new Set(existing.map((row) => row.studentId));
  const toInsert = studentIds.filter((id) => !existingIds.has(id));

  if (toInsert.length > 0) {
    await db.insert(parentStudents).values(
      toInsert.map((studentId) => ({
        tenantId: input.tenantId,
        parentUserId: parent.id,
        studentId,
      })),
    );
  }

  return getParent(parent.id, input.tenantId);
}

export async function unlinkStudent(input: {
  parentId: string;
  tenantId: string;
  studentId: string;
}) {
  const parent = await requireParentUser(input.parentId, input.tenantId);
  const now = new Date();
  await db
    .update(parentStudents)
    .set({ deletedAt: now })
    .where(
      and(
        eq(parentStudents.parentUserId, parent.id),
        eq(parentStudents.studentId, input.studentId),
        eq(parentStudents.tenantId, input.tenantId),
        isNull(parentStudents.deletedAt),
      ),
    );
  return getParent(parent.id, input.tenantId);
}

export async function resetParentPassword(parentId: string, tenantId: string) {
  const parent = await requireParentUser(parentId, tenantId);
  const tempPassword = generateRandomPassword(12);
  const passwordHash = await hashPassword(tempPassword);
  await db
    .update(users)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(users.id, parent.id));
  return { parentId: parent.id, email: parent.email, tempPassword };
}

export async function assertParentOwnsStudent(
  parentUserId: string,
  studentId: string,
  tenantId: string,
) {
  const [link] = await db
    .select({ id: parentStudents.id })
    .from(parentStudents)
    .where(
      and(
        eq(parentStudents.parentUserId, parentUserId),
        eq(parentStudents.studentId, studentId),
        eq(parentStudents.tenantId, tenantId),
        isNull(parentStudents.deletedAt),
      ),
    )
    .limit(1);
  if (!link) throw new ForbiddenError('This student is not linked to your account');
}

export async function listChildrenForParent(parentUserId: string, tenantId: string) {
  return listLinkedStudents(parentUserId, tenantId);
}
