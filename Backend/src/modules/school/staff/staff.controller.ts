import type { Request, Response } from 'express';
import { BadRequestError, UnauthorizedError } from '../../../lib/errors.js';
import { ApiResponse } from '../../../lib/response.js';
import { asyncHandler } from '../../../middleware/async-handler.js';
import { listStaffSchema } from './staff.validator.js';
import * as staffService from './staff.service.js';

function getStaffContext(req: Request) {
  const user = req.user;
  if (!user) throw new UnauthorizedError();
  if (!user.tenantId) throw new BadRequestError('A school account is required');
  return { tenantId: user.tenantId, userId: user.id, permissions: user.permissions };
}

function getStaffId(req: Request): string {
  const { id } = req.params;
  if (typeof id !== 'string') throw new BadRequestError('Invalid staff ID');
  return id;
}

export const staffController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const context = getStaffContext(req);
    const { query } = listStaffSchema.parse({ query: req.query });
    const result = await staffService.listStaff({
      ...query,
      tenantId: context.tenantId,
      isActive: query.isActive === undefined ? undefined : query.isActive === 'true',
    });
    return ApiResponse.paginated(res, result.items, result.pagination, 'Staff fetched');
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const context = getStaffContext(req);
    const staff = await staffService.getStaffById(getStaffId(req), context.tenantId);
    return ApiResponse.success(res, staff, 'Staff fetched');
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const context = getStaffContext(req);
    const result = await staffService.createStaff({
      tenantId: context.tenantId,
      adminPermissions: context.permissions,
      createdBy: context.userId,
      data: req.body,
    });
    return ApiResponse.created(res, result, 'Staff created successfully');
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const context = getStaffContext(req);
    const staff = await staffService.updateStaff({
      staffId: getStaffId(req),
      tenantId: context.tenantId,
      adminPermissions: context.permissions,
      data: req.body,
    });
    return ApiResponse.success(res, staff, 'Staff updated');
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    const context = getStaffContext(req);
    await staffService.deleteStaff(getStaffId(req), context.tenantId, context.userId);
    return ApiResponse.success(res, null, 'Staff deleted');
  }),

  resetPassword: asyncHandler(async (req: Request, res: Response) => {
    const context = getStaffContext(req);
    const result = await staffService.resetStaffPassword(getStaffId(req), context.tenantId);
    return ApiResponse.success(res, result, 'Password reset successfully');
  }),

  availableRoles: asyncHandler(async (req: Request, res: Response) => {
    const context = getStaffContext(req);
    const roles = await staffService.getAvailableRoles(context.tenantId, context.permissions);
    return ApiResponse.success(res, roles, 'Available roles fetched');
  }),
};
