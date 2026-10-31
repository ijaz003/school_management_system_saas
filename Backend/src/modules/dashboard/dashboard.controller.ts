import type { Request, Response } from 'express';
import { BadRequestError, UnauthorizedError } from '../../lib/errors.js';
import { ApiResponse } from '../../lib/response.js';
import { asyncHandler } from '../../middleware/async-handler.js';
import * as dashboardService from './dashboard.service.js';

function getTenantId(req: Request) {
  const user = req.user;
  if (!user) throw new UnauthorizedError();
  if (!user.tenantId) throw new BadRequestError('A school account is required');
  return user.tenantId;
}

export const dashboardController = {
  stats: asyncHandler(async (req: Request, res: Response) => {
    const stats = await dashboardService.getDashboardStats(getTenantId(req));
    return ApiResponse.success(res, stats, 'Dashboard stats fetched');
  }),
};
