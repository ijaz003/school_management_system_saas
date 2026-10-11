import type { Tenant } from './tenants.schema.js';

export type Plan = 'basic' | 'standard' | 'premium';
export type TenantStatus = 'trial' | 'active' | 'suspended' | 'cancelled';

export interface CreateTenantInput {
  name: string;
  slug: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  city?: string;
  address?: string;
  plan?: Plan;
  customPermissions?: string[];
}

export interface CreateTenantOutput {
  tenant: Tenant;
  admin: {
    id: string;
    email: string;
    tempPassword: string;
    fullName: string;
  };
}

export interface UpdateTenantInput {
  name?: string;
  city?: string;
  address?: string;
  logoUrl?: string;
  plan?: Plan;
  status?: TenantStatus;
}

export interface ListTenantsFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: TenantStatus;
  plan?: Plan;
}

export const PLAN_PERMISSIONS = {
  basic: [
    'students.*',
    'teachers.*',
    'classes.*',
    'attendance.*',
    'fees.invoice.*',
    'fees.payment.record',
    'exams.marks.enter',
    'exams.result.publish',
    'notices.send',
    'reports.academic',
    'reports.attendance',
    'settings.school.edit',
    'settings.users.manage',
    'settings.roles.manage',
  ],
  standard: [
    'students.*',
    'teachers.*',
    'classes.*',
    'attendance.*',
    'fees.*',
    'exams.*',
    'notices.*',
    'sms.send',
    'reports.*',
    'settings.*',
    'subscription.view',
  ],
  premium: [
    'students.*',
    'teachers.*',
    'classes.*',
    'attendance.*',
    'fees.*',
    'exams.*',
    'notices.*',
    'sms.send',
    'reports.*',
    'settings.*',
    'subscription.*',
    'whatsapp.send',
    'analytics.advanced',
  ],
} as const satisfies Record<Plan, readonly string[]>;

export const PLAN_LIMITS = {
  basic: { maxStudents: 500, maxTeachers: 50, maxSms: 100, maxRoles: 5 },
  standard: { maxStudents: 2000, maxTeachers: 200, maxSms: 500, maxRoles: 15 },
  premium: {
    maxStudents: 999999,
    maxTeachers: 9999,
    maxSms: 999999,
    maxRoles: 50,
  },
} as const satisfies Record<
  Plan,
  {
    maxStudents: number;
    maxTeachers: number;
    maxSms: number;
    maxRoles: number;
  }
>;
