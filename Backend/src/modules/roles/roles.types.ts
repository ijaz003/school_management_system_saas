import type { Permission, Role } from './roles.schema.js';

export interface CreateRoleInput {
  tenantId: string;
  userId: string;
  adminPermissions: string[];
  data: {
    name: string;
    displayName: string;
    description?: string;
    permissions: string[];
    color?: string;
    icon?: string;
  };
}

export interface UpdateRoleInput {
  roleId: string;
  tenantId: string;
  adminPermissions: string[];
  data: {
    displayName?: string;
    description?: string | null;
    permissions?: string[];
    color?: string | null;
    icon?: string | null;
  };
}

export interface AssignRoleInput {
  userId: string;
  roleId: string;
  tenantId: string;
  adminPermissions: string[];
}

export interface GroupedPermissions {
  [module: string]: {
    module: string;
    displayName: string;
    permissions: Permission[];
  };
}

export type RoleListItem = Role;
