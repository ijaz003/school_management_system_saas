import { and, eq, isNull } from 'drizzle-orm';
import { db } from '../../config/database.js';
import { roles } from '../../modules/roles/roles.schema.js';

export const SYSTEM_ROLES = [
  {
    name: 'super_admin',
    displayName: 'Super Admin',
    description: 'Platform owner — full access',
    permissions: ['*'],
    isSystem: true,
    isSuperAdmin: true,
    category: 'admin',
    color: '#9333ea',
  },
  {
    name: 'school_admin',
    displayName: 'School Admin',
    description: 'School owner — full school access',
    permissions: [
      'students.*', 'teachers.*', 'classes.*', 'attendance.*', 'fees.*',
      'exams.*', 'notices.*', 'sms.send', 'reports.*', 'settings.*',
      'subscription.view',
    ],
    isSystem: true,
    isSuperAdmin: false,
    category: 'admin',
    color: '#2563eb',
  },
  {
    name: 'principal',
    displayName: 'Principal',
    description: 'Principal — view and approve',
    permissions: [
      'students.read', 'fees.invoice.read', 'fees.payment.record',
      'attendance.*', 'exams.marks.approve', 'exams.result.publish',
      'notices.*', 'reports.*',
    ],
    isSystem: true,
    isSuperAdmin: false,
    category: 'admin',
    color: '#0891b2',
  },
  {
    name: 'accountant',
    displayName: 'Accountant',
    description: 'Fee collection and finance',
    permissions: ['students.read', 'fees.*', 'reports.fees'],
    isSystem: true,
    isSuperAdmin: false,
    category: 'staff',
    color: '#16a34a',
  },
  {
    name: 'teacher',
    displayName: 'Teacher',
    description: 'Teaching staff',
    permissions: [
      'students.read', 'attendance.mark', 'attendance.read',
      'exams.marks.enter', 'notices.send',
    ],
    isSystem: true,
    isSuperAdmin: false,
    category: 'staff',
    color: '#ea580c',
  },
  {
    name: 'parent',
    displayName: 'Parent',
    description: 'Parent portal access',
    permissions: [
      'attendance.read', 'exams.result.publish', 'fees.invoice.read',
    ],
    isSystem: true,
    isSuperAdmin: false,
    category: 'portal',
    color: '#7c3aed',
  },
] as const;

export async function seedSystemRoles() {
  let added = 0;
  let skipped = 0;

  for (const role of SYSTEM_ROLES) {
    const [existing] = await db
      .select({ id: roles.id })
      .from(roles)
      .where(and(isNull(roles.tenantId), eq(roles.name, role.name)))
      .limit(1);

    if (existing) {
      skipped++;
      continue;
    }

    await db.insert(roles).values({
      ...role,
      permissions: [...role.permissions],
      tenantId: null,
    });
    added++;
  }

  console.log(`System roles seeded: ${added} added, ${skipped} already present`);
}
