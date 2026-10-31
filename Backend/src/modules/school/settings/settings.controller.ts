import type { Request, Response } from 'express';
import { BadRequestError, UnauthorizedError } from '../../../lib/errors.js';
import { ApiResponse } from '../../../lib/response.js';
import { asyncHandler } from '../../../middleware/async-handler.js';
import * as settingsService from './settings.service.js';

function getSchoolContext(req: Request) {
  const user = req.user;
  if (!user) throw new UnauthorizedError();
  if (!user.tenantId) throw new BadRequestError('A school account is required');
  return { tenantId: user.tenantId };
}

export const settingsController = {
  get: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const settings = await settingsService.getSchoolSettings(context.tenantId);
    return ApiResponse.success(res, settings, 'School settings fetched');
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const settings = await settingsService.updateSchoolSettings(context.tenantId, req.body);
    return ApiResponse.success(res, settings, 'School settings updated');
  }),
};
