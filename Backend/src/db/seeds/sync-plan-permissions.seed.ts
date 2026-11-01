import { and, eq, isNull } from 'drizzle-orm';
import { db } from '../../config/database.js';
import { hasPermission } from '../../lib/permissions.js';
import { users } from '../../modules/auth/auth.schema.js';
import { tenants } from '../../modules/tenants/tenants.schema.js';
import { PLAN_PERMISSIONS, type Plan } from '../../modules/tenants/tenants.types.js';

function mergePlanPermissions(current: string[], plan: Plan): string[] {
  const planPerms = PLAN_PERMISSIONS[plan];
  const merged = [...current];
  for (const permission of planPerms) {
    if (!hasPermission(merged, permission) && !merged.includes(permission)) {
      merged.push(permission);
    }
  }
  return merged;
}

export async function syncPlanPermissions() {
  const tenantRows = await db
    .select({
      id: tenants.id,
      plan: tenants.plan,
      allowedPermissions: tenants.allowedPermissions,
    })
    .from(tenants)
    .where(isNull(tenants.deletedAt));

  let tenantsUpdated = 0;
  let usersUpdated = 0;

  for (const tenant of tenantRows) {
    const plan = tenant.plan as Plan;
    if (!(plan in PLAN_PERMISSIONS)) continue;

    const current = Array.isArray(tenant.allowedPermissions)
      ? (tenant.allowedPermissions as string[])
      : [];
    const next = mergePlanPermissions(current, plan);
    if (next.length !== current.length || next.some((key, i) => key !== current[i])) {
      await db
        .update(tenants)
        .set({ allowedPermissions: next, updatedAt: new Date() })
        .where(eq(tenants.id, tenant.id));
      tenantsUpdated++;
    }

    const adminUsers = await db
      .select({ id: users.id, permissions: users.permissions })
      .from(users)
      .where(
        and(
          eq(users.tenantId, tenant.id),
          eq(users.role, 'school_admin'),
          isNull(users.deletedAt),
        ),
      );

    for (const admin of adminUsers) {
      const adminPerms = Array.isArray(admin.permissions) ? admin.permissions : [];
      const nextAdmin = mergePlanPermissions(adminPerms, plan);
      if (
        nextAdmin.length !== adminPerms.length ||
        nextAdmin.some((key, i) => key !== adminPerms[i])
      ) {
        await db
          .update(users)
          .set({ permissions: nextAdmin, updatedAt: new Date() })
          .where(eq(users.id, admin.id));
        usersUpdated++;
      }
    }
  }

  console.log(
    `Plan permissions synced: ${tenantsUpdated} tenants, ${usersUpdated} school admins updated`,
  );
}
