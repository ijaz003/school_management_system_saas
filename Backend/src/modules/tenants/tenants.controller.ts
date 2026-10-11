import type { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { ApiResponse } from '../../lib/response.js';
import { BadRequestError } from '../../lib/errors.js';
import * as tenantsService from './tenants.service.js';
import { listTenantsSchema } from './tenants.validator.js';

function getTenantId(req: Request): string {
  const id = req.params.id;
  if (typeof id !== 'string') {
    throw new BadRequestError('Invalid tenant ID');
  }
  return id;
}

export const tenantsController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const result = await tenantsService.createTenant(req.body);
    return ApiResponse.created(res, result, 'School created successfully');
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const { query } = listTenantsSchema.parse({ query: req.query });
    const result = await tenantsService.listTenants(query);

    return ApiResponse.paginated(
      res,
      result.items,
      result.pagination,
      'Schools fetched successfully',
    );
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const tenant = await tenantsService.getTenantById(getTenantId(req));
    return ApiResponse.success(res, tenant, 'School fetched');
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const tenant = await tenantsService.updateTenant(getTenantId(req), req.body);
    return ApiResponse.success(res, tenant, 'School updated');
  }),

  updatePermissions: asyncHandler(async (req: Request, res: Response) => {
    const tenant = await tenantsService.updateTenantPermissions(
      getTenantId(req),
      req.body.permissions,
    );
    return ApiResponse.success(res, tenant, 'School permissions updated');
  }),

  suspend: asyncHandler(async (req: Request, res: Response) => {
    const tenant = await tenantsService.suspendTenant(getTenantId(req));
    return ApiResponse.success(res, tenant, 'School suspended');
  }),

  activate: asyncHandler(async (req: Request, res: Response) => {
    const tenant = await tenantsService.activateTenant(getTenantId(req));
    return ApiResponse.success(res, tenant, 'School activated');
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    await tenantsService.deleteTenant(getTenantId(req));
    return ApiResponse.success(res, null, 'School deleted');
  }),
};
