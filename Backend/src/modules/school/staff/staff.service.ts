import {
  and,
  desc,
  eq,
  ilike,
  isNull,
  ne,
  or,
  sql,
} from 'drizzle-orm';
import { db } from '../../../config/database.js';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../../../lib/errors.js';
import {
  canGrantPermissions,
  expandWildcards,
  hasPermission,
  isReservedPermission,
} from '../../../lib/permissions.js';
import { generateRandomPassword, hashPassword } from '../../../lib/password.js';
import { refreshTokens, users } from '../../auth/auth.schema.js';
import { permissions, roles } from '../../roles/roles.schema.js';
import { tenants } from '../../tenants/tenants.schema.js';
import type {
  CreateStaffInput,
  CreateStaffOutput,
  ListStaffFilters,
  SafeStaff,
  UpdateStaffInput,
} from './staff.types.js';
import { toSafeStaff } from './staff.types.js';

async function getAssignableRole(roleId: string, tenantId: string) {
  const [role] = await db
    .select()
    .from(roles)
    .where(
      and(
        eq(roles.id, roleId),
        or(isNull(roles.tenantId), eq(roles.tenantId, tenantId)),
        eq(roles.isVisible, true),
        eq(roles.isSuperAdmin, false),
        isNull(roles.deletedAt),
      ),
    )
    .limit(1);

  if (!role) throw new NotFoundError('Role');
  if (role.isSuperAdmin || isReservedRole(role)) {
    throw new ForbiddenError('Cannot assign this role');
  }
  return role;
}

function isReservedRole(role: { name: string; permissions: string[] }): boolean {
  return (
    role.name === 'super_admin' ||
    role.permissions.includes('*') ||
    role.permissions.some(isReservedPermission)
  );
}

async function ensureRoleGrantable(
  rolePermissions: string[],
  tenantPermissions: string[],
  adminPermissions: string[],
): Promise<string[]> {
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
  const expandedRolePermissions = expandWildcards(rolePermissions, availableKeys);
  const unavailable = expandedRolePermissions.filter(
    (permission) => !hasPermission(tenantPermissions, permission),
  );
  if (unavailable.length > 0) {
    throw new ForbiddenError(
      `This role includes permissions unavailable to the school: ${unavailable.join(', ')}`,
    );
  }

  const grantCheck = canGrantPermissions(adminPermissions, expandedRolePermissions);
  if (!grantCheck.allowed) {
    throw new ForbiddenError(
      `You cannot assign this role; missing permissions: ${grantCheck.forbidden.join(', ')}`,
    );
  }
  return rolePermissions;
}

function subjectMetadata(
  metadata: Record<string, unknown> | null,
  subject: string | null | undefined,
): Record<string, unknown> | null {
  if (subject === undefined) return metadata;
  const next = { ...(metadata ?? {}) };
  if (subject === null || subject === '') delete next.subject;
  else next.subject = subject;
  return Object.keys(next).length > 0 ? next : null;
}

export async function listStaff(filters: ListStaffFilters) {
  const { tenantId, page = 1, limit = 20, search, role, isActive } = filters;
  const conditions = [
    eq(users.tenantId, tenantId),
    isNull(users.deletedAt),
    ne(users.role, 'school_admin'),
  ];

  if (role) conditions.push(eq(users.role, role));
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
  const total = countRows[0]?.count ?? 0;

  return {
    items: items.map(toSafeStaff),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getStaffById(staffId: string, tenantId: string): Promise<SafeStaff> {
  const [staff] = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.id, staffId),
        eq(users.tenantId, tenantId),
        ne(users.role, 'school_admin'),
        isNull(users.deletedAt),
      ),
    )
    .limit(1);
  if (!staff) throw new NotFoundError('Staff member');
  return toSafeStaff(staff);
}

export async function createStaff(input: CreateStaffInput): Promise<CreateStaffOutput> {
  const email = input.data.email.trim().toLowerCase();
  const role = await getAssignableRole(input.data.roleId, input.tenantId);
  const tempPassword = generateRandomPassword(12);
  const passwordHash = await hashPassword(tempPassword);
  const staff = await db.transaction(async (tx) => {
    const [tenant] = await tx
      .select({
        maxTeachers: tenants.maxTeachers,
        status: tenants.status,
        allowedPermissions: tenants.allowedPermissions,
      })
      .from(tenants)
      .where(and(eq(tenants.id, input.tenantId), isNull(tenants.deletedAt)))
      .for('update')
      .limit(1);
    if (!tenant) throw new NotFoundError('School');
    if (tenant.status === 'suspended' || tenant.status === 'cancelled') {
      throw new ForbiddenError('School is not active');
    }
    const staffPermissions = await ensureRoleGrantable(
      role.permissions,
      tenant.allowedPermissions,
      input.adminPermissions,
    );

    const [countRow] = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(
        and(
          eq(users.tenantId, input.tenantId),
          ne(users.role, 'school_admin'),
          isNull(users.deletedAt),
        ),
      );
    if ((countRow?.count ?? 0) >= tenant.maxTeachers) {
      throw new ForbiddenError(
        `Your plan allows ${tenant.maxTeachers} staff members. Upgrade to add more.`,
      );
    }

    const [existing] = await tx
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.email, email), eq(users.tenantId, input.tenantId)))
      .limit(1);
    if (existing) throw new ConflictError('Email already registered in this school');

    const [created] = await tx
      .insert(users)
      .values({
        tenantId: input.tenantId,
        email,
        phone: input.data.phone.trim(),
        passwordHash,
        fullName: input.data.fullName.trim(),
        role: role.name,
        roleId: role.id,
        permissions: staffPermissions,
        isActive: true,
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
        metadata: {
          ...(input.data.subject ? { subject: input.data.subject.trim() } : {}),
          ...(input.data.joiningDate ? { joiningDate: input.data.joiningDate } : {}),
          createdBy: input.createdBy,
        },
      })
      .returning();
    if (!created) throw new Error('Staff insert did not return the created user');
    return created;
  });

  return { staff: toSafeStaff(staff), tempPassword, emailSent: false };
}

export async function updateStaff(input: UpdateStaffInput): Promise<SafeStaff> {
  const [staff] = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.id, input.staffId),
        eq(users.tenantId, input.tenantId),
        ne(users.role, 'school_admin'),
        isNull(users.deletedAt),
      ),
    )
    .limit(1);
  if (!staff) throw new NotFoundError('Staff member');

  let roleUpdate: { id: string; name: string; permissions: string[] } | undefined;
  if (input.data.roleId && input.data.roleId !== staff.roleId) {
    const [tenant] = await db
      .select({ allowedPermissions: tenants.allowedPermissions })
      .from(tenants)
      .where(and(eq(tenants.id, input.tenantId), isNull(tenants.deletedAt)))
      .limit(1);
    if (!tenant) throw new NotFoundError('School');
    const role = await getAssignableRole(input.data.roleId, input.tenantId);
    await ensureRoleGrantable(
      role.permissions,
      tenant.allowedPermissions,
      input.adminPermissions,
    );
    roleUpdate = { id: role.id, name: role.name, permissions: role.permissions };
  }

  const updated = await db.transaction(async (tx) => {
    const now = new Date();
    const [result] = await tx
      .update(users)
      .set({
        ...(input.data.fullName !== undefined ? { fullName: input.data.fullName.trim() } : {}),
        ...(input.data.phone !== undefined ? { phone: input.data.phone.trim() } : {}),
        ...(input.data.isActive !== undefined ? { isActive: input.data.isActive } : {}),
        ...(roleUpdate
          ? { roleId: roleUpdate.id, role: roleUpdate.name, permissions: roleUpdate.permissions }
          : {}),
        ...(input.data.subject !== undefined
          ? { metadata: subjectMetadata(staff.metadata, input.data.subject) }
          : {}),
        updatedAt: now,
      })
      .where(and(eq(users.id, input.staffId), eq(users.tenantId, input.tenantId)))
      .returning();
    if (!result) return undefined;

    if (roleUpdate || input.data.isActive === false) {
      await tx
        .update(refreshTokens)
        .set({ revokedAt: now })
        .where(
          and(
            eq(refreshTokens.userId, input.staffId),
            isNull(refreshTokens.revokedAt),
          ),
        );
    }
    return result;
  });
  if (!updated) throw new NotFoundError('Staff member');
  return toSafeStaff(updated);
}

export async function deleteStaff(staffId: string, tenantId: string, currentUserId: string) {
  if (staffId === currentUserId) throw new ForbiddenError('Cannot delete your own account');
  const [staff] = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(
      and(
        eq(users.id, staffId),
        eq(users.tenantId, tenantId),
        isNull(users.deletedAt),
      ),
    )
    .limit(1);
  if (!staff || staff.role === 'school_admin') throw new NotFoundError('Staff member');

  const deletedAt = new Date();
  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({ isActive: false, deletedAt, updatedAt: deletedAt })
      .where(and(eq(users.id, staffId), eq(users.tenantId, tenantId)));
    await tx
      .update(refreshTokens)
      .set({ revokedAt: deletedAt })
      .where(and(eq(refreshTokens.userId, staffId), isNull(refreshTokens.revokedAt)));
  });
}

export async function resetStaffPassword(staffId: string, tenantId: string) {
  const [staff] = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(
      and(
        eq(users.id, staffId),
        eq(users.tenantId, tenantId),
        isNull(users.deletedAt),
        ne(users.role, 'school_admin'),
      ),
    )
    .limit(1);
  if (!staff) throw new NotFoundError('Staff member');

  const tempPassword = generateRandomPassword(12);
  const passwordHash = await hashPassword(tempPassword);
  const now = new Date();
  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({
        passwordHash,
        failedLoginAttempts: '0',
        lockedUntil: null,
        updatedAt: now,
      })
      .where(eq(users.id, staffId));
    await tx
      .update(refreshTokens)
      .set({ revokedAt: now })
      .where(and(eq(refreshTokens.userId, staffId), isNull(refreshTokens.revokedAt)));
  });

  return { tempPassword, email: staff.email, emailSent: false };
}

export async function getAvailableRoles(
  tenantId: string,
  adminPermissions: string[],
) {
  const [tenant] = await db
    .select({ allowedPermissions: tenants.allowedPermissions })
    .from(tenants)
    .where(and(eq(tenants.id, tenantId), isNull(tenants.deletedAt)))
    .limit(1);
  if (!tenant) throw new NotFoundError('School');

  const roleRows = await db
    .select()
    .from(roles)
    .where(
      and(
        or(isNull(roles.tenantId), eq(roles.tenantId, tenantId)),
        eq(roles.isVisible, true),
        eq(roles.isSuperAdmin, false),
        isNull(roles.deletedAt),
      ),
    )
    .orderBy(roles.isSystem, roles.displayName);

  const assignableRoles = [];
  for (const role of roleRows) {
    try {
      await ensureRoleGrantable(
        role.permissions,
        tenant.allowedPermissions,
        adminPermissions,
      );
      if (!isReservedRole(role)) assignableRoles.push(role);
    } catch (error) {
      if (error instanceof ForbiddenError) continue;
      throw error;
    }
  }
  return assignableRoles;
}
