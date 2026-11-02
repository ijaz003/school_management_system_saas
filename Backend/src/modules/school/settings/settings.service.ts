import { and, eq, isNull } from 'drizzle-orm';
import { db } from '../../../config/database.js';
import { ForbiddenError, NotFoundError } from '../../../lib/errors.js';
import { normalizeTenantLocale } from '../../../lib/tenant-locale.js';
import { tenants } from '../../tenants/tenants.schema.js';

export interface SchoolSettingsUpdate {
  name?: string;
  city?: string | null;
  address?: string | null;
  logoUrl?: string | null;
  ownerName?: string;
  ownerPhone?: string;
  settings?: {
    academicYear?: string;
    currentSessionYearId?: string;
    gradingSystem?: string;
    timezone?: string;
    dateFormat?: string;
    currency?: string;
    cardAttendanceEnabled?: boolean;
  };
}

function toSchoolSettings(tenant: typeof tenants.$inferSelect) {
  const settings = tenant.settings ?? {};
  const locale = normalizeTenantLocale(settings);
  return {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    city: tenant.city,
    address: tenant.address,
    logoUrl: tenant.logoUrl,
    ownerName: tenant.ownerName,
    ownerEmail: tenant.ownerEmail,
    ownerPhone: tenant.ownerPhone,
    plan: tenant.plan,
    status: tenant.status,
    settings: {
      ...settings,
      timezone: locale.timezone,
      dateFormat: locale.dateFormat,
    },
    maxStudents: tenant.maxStudents,
    maxTeachers: tenant.maxTeachers,
    updatedAt: tenant.updatedAt,
  };
}

export async function getSchoolSettings(tenantId: string) {
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(and(eq(tenants.id, tenantId), isNull(tenants.deletedAt)))
    .limit(1);
  if (!tenant) throw new NotFoundError('School');
  return toSchoolSettings(tenant);
}

export async function updateSchoolSettings(tenantId: string, data: SchoolSettingsUpdate) {
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(and(eq(tenants.id, tenantId), isNull(tenants.deletedAt)))
    .limit(1);
  if (!tenant) throw new NotFoundError('School');
  if (tenant.status === 'suspended' || tenant.status === 'cancelled') {
    throw new ForbiddenError('School is not active');
  }

  const mergedSettings = {
    ...(tenant.settings ?? {}),
    ...(data.settings ?? {}),
  };
  const locale = normalizeTenantLocale(mergedSettings);
  const nextSettings = {
    ...mergedSettings,
    timezone: locale.timezone,
    dateFormat: locale.dateFormat,
  };

  const [updated] = await db
    .update(tenants)
    .set({
      ...(data.name !== undefined ? { name: data.name.trim() } : {}),
      ...(data.city !== undefined ? { city: data.city || null } : {}),
      ...(data.address !== undefined ? { address: data.address || null } : {}),
      ...(data.logoUrl !== undefined ? { logoUrl: data.logoUrl || null } : {}),
      ...(data.ownerName !== undefined ? { ownerName: data.ownerName.trim() } : {}),
      ...(data.ownerPhone !== undefined ? { ownerPhone: data.ownerPhone.trim() } : {}),
      ...(data.settings !== undefined ? { settings: nextSettings } : {}),
      updatedAt: new Date(),
    })
    .where(eq(tenants.id, tenantId))
    .returning();

  if (!updated) throw new NotFoundError('School');
  return toSchoolSettings(updated);
}
