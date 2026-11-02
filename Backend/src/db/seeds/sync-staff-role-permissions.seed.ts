import { and, eq, inArray, isNull, ne, sql } from 'drizzle-orm';
import { db } from '../../config/database.js';
import { hasPermission } from '../../lib/permissions.js';
import { users } from '../../modules/auth/auth.schema.js';
import { roles } from '../../modules/roles/roles.schema.js';
import { tenants } from '../../modules/tenants/tenants.schema.js';

function samePermissions(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((key, i) => key === sortedB[i]);
}

function filterByTenantPlan(rolePermissions: string[], tenantAllowed: string[]): string[] {
  if (tenantAllowed.includes('*')) return [...rolePermissions];
  return rolePermissions.filter(
    (permission) =>
      hasPermission(tenantAllowed, permission) ||
      (permission.endsWith('.*') &&
        tenantAllowed.some(
          (allowed) =>
            allowed === permission ||
            (allowed.endsWith('.*') &&
              (allowed.startsWith(permission.slice(0, -1)) ||
                permission.startsWith(allowed.slice(0, -1)))) ||
            allowed.startsWith(permission.slice(0, -1)),
        )),
  );
}

/**
 * Re-apply role permission sets onto staff/parent users so seed role updates
 * take effect without recreating accounts.
 */
export async function syncStaffRolePermissions() {
  const staffUsers = await db
    .select({
      id: users.id,
      roleId: users.roleId,
      permissions: users.permissions,
      tenantId: users.tenantId,
    })
    .from(users)
    .where(
      and(
        isNull(users.deletedAt),
        ne(users.role, 'school_admin'),
        ne(users.role, 'super_admin'),
        sql`${users.roleId} is not null`,
      ),
    );

  if (staffUsers.length === 0) {
    console.log('Staff role permissions synced: 0 users updated');
    return;
  }

  const roleIds = [...new Set(staffUsers.map((u) => u.roleId!).filter(Boolean))];
  const roleRows = await db
    .select({
      id: roles.id,
      permissions: roles.permissions,
    })
    .from(roles)
    .where(inArray(roles.id, roleIds));

  const roleMap = new Map(roleRows.map((role) => [role.id, role]));

  const tenantIds = [...new Set(staffUsers.map((u) => u.tenantId).filter(Boolean))] as string[];
  const tenantRows =
    tenantIds.length === 0
      ? []
      : await db
          .select({
            id: tenants.id,
            allowedPermissions: tenants.allowedPermissions,
          })
          .from(tenants)
          .where(inArray(tenants.id, tenantIds));

  const tenantMap = new Map(tenantRows.map((tenant) => [tenant.id, tenant]));

  let updated = 0;

  for (const staff of staffUsers) {
    if (!staff.roleId || !staff.tenantId) continue;
    const role = roleMap.get(staff.roleId);
    if (!role) continue;

    const tenant = tenantMap.get(staff.tenantId);
    const tenantAllowed = Array.isArray(tenant?.allowedPermissions)
      ? (tenant!.allowedPermissions as string[])
      : [];
    const rolePermissions = Array.isArray(role.permissions) ? (role.permissions as string[]) : [];
    const next = filterByTenantPlan(rolePermissions, tenantAllowed);
    const current = Array.isArray(staff.permissions) ? (staff.permissions as string[]) : [];

    if (samePermissions(current, next)) continue;

    await db
      .update(users)
      .set({ permissions: next, updatedAt: new Date() })
      .where(eq(users.id, staff.id));
    updated++;
  }

  console.log(`Staff role permissions synced: ${updated} users updated`);
}
