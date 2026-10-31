import type { Request, Response } from 'express';
import { recordAuditFromRequest } from '../../lib/audit.js';
import { BadRequestError, UnauthorizedError } from '../../lib/errors.js';
import { asyncHandler } from '../../middleware/async-handler.js';
import { ApiResponse } from '../../lib/response.js';
import * as rolesService from './roles.service.js';

type AuthenticatedSchoolUser = NonNullable<Request['user']> & {
  tenantId: string;
};

function getRouteId(value: string | string[] | undefined): string {
  if (typeof value !== 'string') {
    throw new BadRequestError('Invalid route ID');
  }
  return value;
}

function getSchoolUser(req: Request): AuthenticatedSchoolUser {
  const user = req.user;
  if (!user) throw new UnauthorizedError();
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw new BadRequestError('A school account is required');
  }
  return { ...user, tenantId };
}

export const rolesController = {
  listTenantRoles: asyncHandler(async (req: Request, res: Response) => {
    const user = getSchoolUser(req);
    const result = await rolesService.listTenantRoles(user.tenantId);
    return ApiResponse.success(res, result, 'Roles fetched');
  }),

  getAvailablePermissions: asyncHandler(
    async (req: Request, res: Response) => {
      const user = getSchoolUser(req);
      const grouped = await rolesService.getAvailablePermissions(
        user.tenantId,
        user.permissions,
      );
      const total = Object.values(grouped).reduce(
        (sum, group) => sum + group.permissions.length,
        0,
      );

      return ApiResponse.success(
        res,
        { grouped, total },
        'Available permissions fetched',
      );
    },
  ),

  create: asyncHandler(async (req: Request, res: Response) => {
    const user = getSchoolUser(req);
    const role = await rolesService.createCustomRole({
      tenantId: user.tenantId,
      userId: user.id,
      adminPermissions: user.permissions,
      data: req.body,
    });
    recordAuditFromRequest(req, {
      tenantId: user.tenantId,
      actorId: user.id,
      action: 'roles.create',
      entityType: 'role',
      entityId: role.id,
      summary: `Created role "${role.name}"`,
    });

    return ApiResponse.created(res, role, 'Role created successfully');
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const user = getSchoolUser(req);
    const role = await rolesService.getRoleById(
      getRouteId(req.params.id),
      user.tenantId,
    );
    return ApiResponse.success(res, role, 'Role fetched');
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const user = getSchoolUser(req);
    const role = await rolesService.updateRole({
      roleId: getRouteId(req.params.id),
      tenantId: user.tenantId,
      adminPermissions: user.permissions,
      data: req.body,
    });
    recordAuditFromRequest(req, {
      tenantId: user.tenantId,
      actorId: user.id,
      action: 'roles.update',
      entityType: 'role',
      entityId: role.id,
      summary: `Updated role "${role.name}"`,
    });
    return ApiResponse.success(res, role, 'Role updated successfully');
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    const user = getSchoolUser(req);
    const roleId = getRouteId(req.params.id);
    await rolesService.deleteRole(roleId, user.tenantId);
    recordAuditFromRequest(req, {
      tenantId: user.tenantId,
      actorId: user.id,
      action: 'roles.delete',
      entityType: 'role',
      entityId: roleId,
      summary: 'Deleted custom role',
    });
    return ApiResponse.success(res, null, 'Role deleted successfully');
  }),

  assignRole: asyncHandler(async (req: Request, res: Response) => {
    const user = getSchoolUser(req);
    const targetUserId = getRouteId(req.params.userId);
    const result = await rolesService.assignRoleToUser({
      userId: targetUserId,
      roleId: req.body.roleId,
      tenantId: user.tenantId,
      adminPermissions: user.permissions,
    });
    recordAuditFromRequest(req, {
      tenantId: user.tenantId,
      actorId: user.id,
      action: 'roles.assign',
      entityType: 'user',
      entityId: targetUserId,
      summary: 'Assigned role to user',
      metadata: { roleId: req.body.roleId },
    });
    return ApiResponse.success(res, result, 'Role assigned successfully');
  }),

  listSystemRoles: asyncHandler(async (_req: Request, res: Response) => {
    const roles = await rolesService.listSystemRoles();
    return ApiResponse.success(res, roles, 'System roles fetched');
  }),

  listPermissions: asyncHandler(async (_req: Request, res: Response) => {
    const result = await rolesService.listAvailablePermissions();
    return ApiResponse.success(res, result, 'Permissions fetched');
  }),
};
