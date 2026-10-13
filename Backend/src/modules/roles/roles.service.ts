import {
  and,
  asc,
  eq,
  inArray,
  isNull,
  or,
  sql,
} from 'drizzle-orm';
import { db } from '../../config/database.js';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../../lib/errors.js';
import {
  canGrantPermissions,
  hasPermission,
  isReservedPermission,
} from '../../lib/permissions.js';
import { refreshTokens, users } from '../auth/auth.schema.js';
import { tenants } from '../tenants/tenants.schema.js';
import { permissions, roles } from './roles.schema.js';
import type {
  AssignRoleInput,
  CreateRoleInput,
  GroupedPermissions,
  UpdateRoleInput,
} from './roles.types.js';

function matchesPattern(pattern: string, permission: string): boolean {
  if (pattern === '*') return true;
  if (pattern.endsWith('.*')) {
    return permission.startsWith(pattern.slice(0, -1));
  }
  return pattern === permission;
}

async function validateAssignablePermissions(
  tenantId: string,
  adminPermissions: string[],
  requested: string[],
): Promise<string[]> {
  const uniqueRequested = [...new Set(requested.map((permission) => permission.trim()))];

  if (
    uniqueRequested.length === 0 ||
    uniqueRequested.some(
      (permission) => permission === '*' || isReservedPermission(permission),
    )
  ) {
    throw new ForbiddenError('Reserved or wildcard permissions cannot be assigned');
  }

  const [tenant] = await db
    .select({
      allowedPermissions: tenants.allowedPermissions,
      deletedAt: tenants.deletedAt,
      status: tenants.status,
    })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  if (!tenant || tenant.deletedAt) {
    throw new NotFoundError('School');
  }

  if (tenant.status === 'suspended' || tenant.status === 'cancelled') {
    throw new ForbiddenError('School is not active');
  }

  const available = await db
    .select({ key: permissions.key })
    .from(permissions)
    .where(
      and(
        eq(permissions.isActive, true),
        eq(permissions.isAssignableToSchools, true),
      ),
    );
  const availableKeys = available
    .map(({ key }) => key)
    .filter((key) => !isReservedPermission(key));

  const expanded = new Set<string>();
  const matchedPermissions = new Set<string>();
  for (const requestedPermission of uniqueRequested) {
    const matched = availableKeys.filter((key) =>
      matchesPattern(requestedPermission, key),
    );

    if (matched.length === 0) {
      throw new BadRequestError(
        `Unknown or unavailable permission: ${requestedPermission}`,
      );
    }

    for (const key of matched) {
      matchedPermissions.add(key);
      if (
        !hasPermission(tenant.allowedPermissions, key) ||
        !hasPermission(adminPermissions, key)
      ) {
        expanded.add(key);
      }
    }
  }

  const forbidden = [...expanded];
  if (forbidden.length > 0) {
    throw new ForbiddenError(
      `You cannot assign these permissions: ${forbidden.join(', ')}`,
    );
  }

  const grantCheck = canGrantPermissions(
    adminPermissions,
    [...matchedPermissions],
  );
  if (!grantCheck.allowed) {
    throw new ForbiddenError(
      `You cannot assign these permissions: ${grantCheck.forbidden.join(', ')}`,
    );
  }

  return uniqueRequested;
}

export async function listSystemRoles() {
  return db
    .select()
    .from(roles)
    .where(
      and(
        isNull(roles.tenantId),
        isNull(roles.deletedAt),
        eq(roles.isSystem, true),
      ),
    )
    .orderBy(asc(roles.displayName));
}

export async function listTenantRoles(tenantId: string) {
  const tenantRoles = await db
    .select()
    .from(roles)
    .where(
      and(
        or(isNull(roles.tenantId), eq(roles.tenantId, tenantId)),
        eq(roles.isSuperAdmin, false),
        isNull(roles.deletedAt),
      ),
    )
    .orderBy(asc(roles.isSystem), asc(roles.displayName));

  if (tenantRoles.length === 0) return [];

  const userCounts = await db
    .select({
      roleId: users.roleId,
      count: sql<number>`count(*)::int`,
    })
    .from(users)
    .where(
      and(
        eq(users.tenantId, tenantId),
        inArray(users.roleId, tenantRoles.map(({ id }) => id)),
        isNull(users.deletedAt),
      ),
    )
    .groupBy(users.roleId);
  const countsByRole = new Map(
    userCounts.map(({ roleId, count }) => [roleId, Number(count)]),
  );

  return tenantRoles.map((role) => ({
    ...role,
    userCount: countsByRole.get(role.id) ?? 0,
  }));
}

export async function listCustomRoles(tenantId: string) {
  return db
    .select()
    .from(roles)
    .where(
      and(
        eq(roles.tenantId, tenantId),
        eq(roles.isSystem, false),
        isNull(roles.deletedAt),
      ),
    )
    .orderBy(asc(roles.displayName));
}

export async function getAvailablePermissions(
  tenantId: string,
  adminPermissions: string[],
): Promise<GroupedPermissions> {
  const [tenant] = await db
    .select({ allowedPermissions: tenants.allowedPermissions })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  if (!tenant) throw new NotFoundError('School');

  const allPermissions = await db
    .select()
    .from(permissions)
    .where(
      and(
        eq(permissions.isActive, true),
        eq(permissions.isAssignableToSchools, true),
      ),
    );

  const grouped: GroupedPermissions = {};

  for (const permission of allPermissions) {
    if (
      isReservedPermission(permission.key) ||
      !hasPermission(adminPermissions, permission.key) ||
      !hasPermission(tenant.allowedPermissions, permission.key)
    ) {
      continue;
    }

    if (!grouped[permission.module]) {
      grouped[permission.module] = {
        module: permission.module,
        displayName:
          permission.module.charAt(0).toUpperCase() +
          permission.module.slice(1),
        permissions: [],
      };
    }

    grouped[permission.module].permissions.push(permission);
  }

  for (const group of Object.values(grouped)) {
    group.permissions.sort((a, b) =>
      a.displayName.localeCompare(b.displayName),
    );
  }

  return grouped;
}

export async function createCustomRole(input: CreateRoleInput) {
  const name = input.data.name.trim();
  const displayName = input.data.displayName.trim();
  const requestedPermissions = await validateAssignablePermissions(
    input.tenantId,
    input.adminPermissions,
    input.data.permissions,
  );

  return db.transaction(async (tx) => {
    const [tenant] = await tx
      .select()
      .from(tenants)
      .where(
        and(
          eq(tenants.id, input.tenantId),
          isNull(tenants.deletedAt),
        ),
      )
      .for('update')
      .limit(1);

    if (!tenant) throw new NotFoundError('School');

    if (tenant.status === 'suspended' || tenant.status === 'cancelled') {
      throw new ForbiddenError('School is not active');
    }

    const [existing] = await tx
      .select({ id: roles.id })
      .from(roles)
      .where(
        and(
          eq(roles.tenantId, input.tenantId),
          eq(roles.name, name),
          isNull(roles.deletedAt),
        ),
      )
      .limit(1);

    if (existing) {
      throw new ConflictError('Role name already exists in your school');
    }

    const [countResult] = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(roles)
      .where(
        and(
          eq(roles.tenantId, input.tenantId),
          eq(roles.isSystem, false),
          isNull(roles.deletedAt),
        ),
      );
    const currentCount = Number(countResult?.count ?? 0);

    if (currentCount >= tenant.maxCustomRoles) {
      throw new ForbiddenError(
        `Your plan allows ${tenant.maxCustomRoles} custom roles. Upgrade to add more.`,
      );
    }

    const [role] = await tx
      .insert(roles)
      .values({
        tenantId: input.tenantId,
        name,
        displayName,
        description: input.data.description?.trim(),
        permissions: requestedPermissions,
        color: input.data.color ?? '#2563eb',
        icon: input.data.icon?.trim(),
        isSystem: false,
        isSuperAdmin: false,
        category: 'staff',
        createdBy: input.userId,
      })
      .returning();

    if (!role) throw new Error('Role insert did not return the created role');
    return role;
  });
}

export async function updateRole(input: UpdateRoleInput) {
  const requestedPermissions = input.data.permissions
    ? await validateAssignablePermissions(
        input.tenantId,
        input.adminPermissions,
        input.data.permissions,
      )
    : undefined;

  return db.transaction(async (tx) => {
    const [role] = await tx
      .select()
      .from(roles)
      .where(
        and(
          eq(roles.id, input.roleId),
          eq(roles.tenantId, input.tenantId),
          eq(roles.isSystem, false),
          isNull(roles.deletedAt),
        ),
      )
      .for('update')
      .limit(1);

    if (!role) throw new NotFoundError('Role');

    const updateData = {
      ...input.data,
      ...(requestedPermissions ? { permissions: requestedPermissions } : {}),
      ...(input.data.displayName !== undefined
        ? { displayName: input.data.displayName.trim() }
        : {}),
      ...(typeof input.data.description === 'string'
        ? { description: input.data.description.trim() }
        : {}),
      ...(typeof input.data.icon === 'string'
        ? { icon: input.data.icon.trim() }
        : {}),
      updatedAt: new Date(),
    };

    const [updated] = await tx
      .update(roles)
      .set(updateData)
      .where(eq(roles.id, input.roleId))
      .returning();

    if (!updated) throw new NotFoundError('Role');

    if (requestedPermissions) {
      const assignedUsers = await tx
        .select({ id: users.id })
        .from(users)
        .where(
          and(
            eq(users.roleId, input.roleId),
            eq(users.tenantId, input.tenantId),
          ),
        );
      const userIds = assignedUsers.map(({ id }) => id);

      if (userIds.length > 0) {
        await tx
          .update(users)
          .set({
            permissions: requestedPermissions,
            updatedAt: new Date(),
          })
          .where(inArray(users.id, userIds));

        await tx
          .update(refreshTokens)
          .set({ revokedAt: new Date() })
          .where(
            and(
              inArray(refreshTokens.userId, userIds),
              isNull(refreshTokens.revokedAt),
            ),
          );
      }
    }

    return updated;
  });
}

export async function deleteRole(roleId: string, tenantId: string) {
  return db.transaction(async (tx) => {
    const [role] = await tx
      .select()
      .from(roles)
      .where(
        and(
          eq(roles.id, roleId),
          eq(roles.tenantId, tenantId),
          isNull(roles.deletedAt),
        ),
      )
      .for('update')
      .limit(1);

    if (!role) throw new NotFoundError('Role');
    if (role.isSystem || role.isSuperAdmin) {
      throw new ForbiddenError('Cannot delete system roles');
    }

    const assignedUsers = await tx
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          eq(users.roleId, roleId),
          eq(users.tenantId, tenantId),
          isNull(users.deletedAt),
        ),
      );

    if (assignedUsers.length > 0) {
      throw new BadRequestError(
        `Cannot delete — ${assignedUsers.length} user(s) have this role. Reassign them first.`,
      );
    }

    await tx
      .update(roles)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(roles.id, roleId));

    return { id: roleId };
  });
}

export async function assignRoleToUser(input: AssignRoleInput) {
  return db.transaction(async (tx) => {
    const [user] = await tx
      .select()
      .from(users)
      .where(
        and(
          eq(users.id, input.userId),
          eq(users.tenantId, input.tenantId),
          eq(users.isActive, true),
          isNull(users.deletedAt),
        ),
      )
      .for('update')
      .limit(1);

    if (!user) throw new NotFoundError('User');

    const [role] = await tx
      .select()
      .from(roles)
      .where(
        and(
          eq(roles.id, input.roleId),
          or(isNull(roles.tenantId), eq(roles.tenantId, input.tenantId)),
          isNull(roles.deletedAt),
        ),
      )
      .limit(1);

    if (!role) throw new NotFoundError('Role');
    if (role.isSuperAdmin) {
      throw new ForbiddenError('Cannot assign super admin role');
    }

    const checkedPermissions = await validateAssignablePermissions(
      input.tenantId,
      input.adminPermissions,
      role.permissions,
    );

    await tx
      .update(users)
      .set({
        roleId: role.id,
        role: role.name,
        permissions: checkedPermissions,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    await tx
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(refreshTokens.userId, user.id),
          isNull(refreshTokens.revokedAt),
        ),
      );

    return {
      userId: user.id,
      roleId: role.id,
      roleName: role.name,
      permissions: checkedPermissions,
    };
  });
}

export async function getRoleById(roleId: string, tenantId: string) {
  const [role] = await db
    .select()
    .from(roles)
    .where(
      and(
        eq(roles.id, roleId),
        or(isNull(roles.tenantId), eq(roles.tenantId, tenantId)),
        eq(roles.isSuperAdmin, false),
        isNull(roles.deletedAt),
      ),
    )
    .limit(1);

  if (!role) throw new NotFoundError('Role');
  return role;
}

export async function listAvailablePermissions() {
  return db
    .select()
    .from(permissions)
    .where(eq(permissions.isActive, true))
    .orderBy(asc(permissions.module), asc(permissions.displayName));
}
