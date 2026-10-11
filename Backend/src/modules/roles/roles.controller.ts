import type { Request, Response } from 'express';
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
    return ApiResponse.success(res, role, 'Role updated successfully');
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    const user = getSchoolUser(req);
    await rolesService.deleteRole(
      getRouteId(req.params.id),
      user.tenantId,
    );
    return ApiResponse.success(res, null, 'Role deleted successfully');
  }),

  assignRole: asyncHandler(async (req: Request, res: Response) => {
    const user = getSchoolUser(req);
    const result = await rolesService.assignRoleToUser({
      userId: getRouteId(req.params.userId),
      roleId: req.body.roleId,
      tenantId: user.tenantId,
      adminPermissions: user.permissions,
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
