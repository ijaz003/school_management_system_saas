import type { User } from '../../auth/auth.schema.js';

export interface CreateStaffInput {
  tenantId: string;
  adminPermissions: string[];
  createdBy: string;
  data: {
    fullName: string;
    email: string;
    phone: string;
    roleId: string;
    subject?: string;
    joiningDate?: string;
    sendEmail?: boolean;
  };
}

export interface CreateStaffOutput {
  staff: SafeStaff;
  tempPassword: string;
  emailSent: boolean;
}

export interface UpdateStaffInput {
  staffId: string;
  tenantId: string;
  adminPermissions: string[];
  data: {
    fullName?: string;
    phone?: string;
    roleId?: string;
    subject?: string;
    isActive?: boolean;
  };
}

export interface ListStaffFilters {
  tenantId: string;
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  isActive?: boolean;
}

export type SafeStaff = Omit<
  User,
  'passwordHash' | 'twoFactorSecret' | 'resetToken' | 'resetTokenExpiry'
>;

export function toSafeStaff(user: User): SafeStaff {
  const sensitiveFields = new Set([
    'passwordHash',
    'twoFactorSecret',
    'resetToken',
    'resetTokenExpiry',
  ]);
  return Object.fromEntries(
    Object.entries(user).filter(([field]) => !sensitiveFields.has(field)),
  ) as SafeStaff;
}
