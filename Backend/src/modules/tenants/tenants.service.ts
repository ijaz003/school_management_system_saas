import {
  and,
  desc,
  eq,
  ilike,
  inArray,
  isNull,
  or,
  sql,
} from 'drizzle-orm';
import { db } from '../../config/database.js';
import { ConflictError, NotFoundError, BadRequestError } from '../../lib/errors.js';
import {
  generateRandomPassword,
  hashPassword,
} from '../../lib/password.js';
import { generateSlug, isReservedSlug } from '../../lib/slug.js';
import { refreshTokens, users } from '../auth/auth.schema.js';
import { tenants } from './tenants.schema.js';
import {
  PLAN_LIMITS,
  PLAN_PERMISSIONS,
  type CreateTenantInput,
  type CreateTenantOutput,
  type ListTenantsFilters,
  type Plan,
  type UpdateTenantInput,
} from './tenants.types.js';
import { hasPermission } from '../../lib/permissions.js';

function permissionFitsPlan(permission: string, planPermissions: readonly string[]) {
  return planPermissions.some((planPermission) =>
    hasPermission([planPermission], permission),
  );
}

export async function createTenant(
  input: CreateTenantInput,
): Promise<CreateTenantOutput> {
  const slug = generateSlug(input.slug);
  const ownerEmail = input.ownerEmail.trim().toLowerCase();
  const ownerName = input.ownerName.trim();
  const plan = input.plan ?? 'basic';

  if (!slug || slug.length < 2 || slug.length > 100) {
    throw new BadRequestError('Slug must produce a valid URL-safe value');
  }

  if (isReservedSlug(slug)) {
    throw new BadRequestError(`Slug "${slug}" is reserved`);
  }

  const allowedPlanPermissions = PLAN_PERMISSIONS[plan];
  const allowedPermissions = input.customPermissions
    ? [...new Set(input.customPermissions)]
    : [...allowedPlanPermissions];

  const disallowedPermissions = allowedPermissions.filter(
    (permission) => !permissionFitsPlan(permission, allowedPlanPermissions),
  );

  if (disallowedPermissions.length > 0) {
    throw new BadRequestError(
      `Permissions are not available on the ${plan} plan: ${disallowedPermissions.join(', ')}`,
    );
  }

  const [existingSlug] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.slug, slug))
    .limit(1);

  if (existingSlug) {
    throw new ConflictError('Slug already taken');
  }

  const limits = PLAN_LIMITS[plan];
  const tempPassword = generateRandomPassword(16);
  const passwordHash = await hashPassword(tempPassword);
  const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  const createdAt = new Date();

  return db.transaction(async (tx) => {
    const [tenant] = await tx
      .insert(tenants)
      .values({
        name: input.name.trim(),
        slug,
        ownerName,
        ownerEmail,
        ownerPhone: input.ownerPhone.trim(),
        city: input.city?.trim(),
        address: input.address?.trim(),
        plan,
        status: 'trial',
        trialEndsAt,
        allowedPermissions,
        maxStudents: limits.maxStudents,
        maxTeachers: limits.maxTeachers,
        maxSmsPerMonth: limits.maxSms,
        maxCustomRoles: limits.maxRoles,
      })
      .returning();

    if (!tenant) {
      throw new Error('Tenant insert did not return the created tenant');
    }

    const [admin] = await tx
      .insert(users)
      .values({
        tenantId: tenant.id,
        email: ownerEmail,
        phone: input.ownerPhone.trim(),
        passwordHash,
        fullName: ownerName,
        role: 'school_admin',
        permissions: allowedPermissions,
        isActive: true,
        isEmailVerified: true,
        emailVerifiedAt: createdAt,
      })
      .returning({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
      });

    if (!admin) {
      throw new Error('School admin insert did not return the created user');
    }

    return {
      tenant,
      admin: {
        ...admin,
        tempPassword,
      },
    };
  });
}

export async function listTenants(filters: ListTenantsFilters) {
  const { page = 1, limit = 20, search, status, plan } = filters;
  const conditions = [isNull(tenants.deletedAt)];

  if (status) conditions.push(eq(tenants.status, status));
  if (plan) conditions.push(eq(tenants.plan, plan));

  if (search) {
    const searchTerm = `%${search.replace(/[\\%_]/g, '\\$&')}%`;
    const searchCondition = or(
      ilike(tenants.name, searchTerm),
      ilike(tenants.slug, searchTerm),
      ilike(tenants.ownerEmail, searchTerm),
    );
    if (searchCondition) conditions.push(searchCondition);
  }

  const whereClause = and(...conditions);
  const offset = (page - 1) * limit;

  const [items, countResult] = await Promise.all([
    db
      .select()
      .from(tenants)
      .where(whereClause)
      .orderBy(desc(tenants.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(tenants)
      .where(whereClause),
  ]);

  const total = countResult[0]?.count ?? 0;

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getTenantById(id: string) {
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(and(eq(tenants.id, id), isNull(tenants.deletedAt)))
    .limit(1);

  if (!tenant) throw new NotFoundError('School');
  return tenant;
}

export async function getTenantBySlug(slug: string) {
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(and(eq(tenants.slug, slug), isNull(tenants.deletedAt)))
    .limit(1);

  if (!tenant) throw new NotFoundError('School');
  return tenant;
}

export async function updateTenant(id: string, input: UpdateTenantInput) {
  await getTenantById(id);
  const nextPlan = input.plan;

  return db.transaction(async (tx) => {
    const updateData = {
      ...input,
      ...(nextPlan
        ? {
            allowedPermissions: [...PLAN_PERMISSIONS[nextPlan]],
            maxStudents: PLAN_LIMITS[nextPlan].maxStudents,
            maxTeachers: PLAN_LIMITS[nextPlan].maxTeachers,
            maxSmsPerMonth: PLAN_LIMITS[nextPlan].maxSms,
            maxCustomRoles: PLAN_LIMITS[nextPlan].maxRoles,
          }
        : {}),
      updatedAt: new Date(),
    };

    const [updated] = await tx
      .update(tenants)
      .set(updateData)
      .where(and(eq(tenants.id, id), isNull(tenants.deletedAt)))
      .returning();

    if (!updated) throw new NotFoundError('School');

    if (nextPlan) {
      await tx
        .update(users)
        .set({
          permissions: [...PLAN_PERMISSIONS[nextPlan]],
          updatedAt: new Date(),
        })
        .where(and(eq(users.tenantId, id), eq(users.role, 'school_admin')));
    }

    return updated;
  });
}

export async function updateTenantPermissions(
  id: string,
  requestedPermissions: string[],
) {
  const tenant = await getTenantById(id);
  const permissions = [...new Set(requestedPermissions)];
  const planPermissions = PLAN_PERMISSIONS[tenant.plan as Plan];
  const disallowedPermissions = permissions.filter(
    (permission) => !permissionFitsPlan(permission, planPermissions),
  );

  if (disallowedPermissions.length > 0) {
    throw new BadRequestError(
      `Permissions are not available on the ${tenant.plan} plan: ${disallowedPermissions.join(', ')}`,
    );
  }

  return db.transaction(async (tx) => {
    const [updated] = await tx
      .update(tenants)
      .set({ allowedPermissions: permissions, updatedAt: new Date() })
      .where(and(eq(tenants.id, id), isNull(tenants.deletedAt)))
      .returning();

    if (!updated) throw new NotFoundError('School');

    await tx
      .update(users)
      .set({ permissions, updatedAt: new Date() })
      .where(and(eq(users.tenantId, id), eq(users.role, 'school_admin')));

    await tx
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(
        and(
          inArray(
            refreshTokens.userId,
            tx.select({ id: users.id }).from(users).where(eq(users.tenantId, id)),
          ),
          isNull(refreshTokens.revokedAt),
        ),
      );

    return updated;
  });
}

export async function suspendTenant(id: string) {
  return updateTenant(id, { status: 'suspended' });
}

export async function activateTenant(id: string) {
  await getTenantById(id);

  const [updated] = await db
    .update(tenants)
    .set({
      status: 'active',
      subscriptionEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
    })
    .where(and(eq(tenants.id, id), isNull(tenants.deletedAt)))
    .returning();

  if (!updated) throw new NotFoundError('School');
  return updated;
}

export async function deleteTenant(id: string) {
  await getTenantById(id);

  return db.transaction(async (tx) => {
    const deletedAt = new Date();
    const [updated] = await tx
      .update(tenants)
      .set({ deletedAt, status: 'cancelled', updatedAt: deletedAt })
      .where(and(eq(tenants.id, id), isNull(tenants.deletedAt)))
      .returning({ id: tenants.id });

    if (!updated) throw new NotFoundError('School');

    await tx
      .update(users)
      .set({ isActive: false, updatedAt: deletedAt })
      .where(eq(users.tenantId, id));

    await tx
      .update(refreshTokens)
      .set({ revokedAt: deletedAt })
      .where(
        and(
          isNull(refreshTokens.revokedAt),
          inArray(
            refreshTokens.userId,
            tx.select({ id: users.id }).from(users).where(eq(users.tenantId, id)),
          ),
        ),
      );

    return { id: updated.id };
  });
}
