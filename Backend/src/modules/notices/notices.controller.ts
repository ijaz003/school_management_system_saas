import type { Request, Response } from 'express';
import { BadRequestError, UnauthorizedError } from '../../lib/errors.js';
import { ApiResponse } from '../../lib/response.js';
import { asyncHandler } from '../../middleware/async-handler.js';
import { listNoticesSchema } from './notices.validator.js';
import * as noticesService from './notices.service.js';

function getSchoolContext(req: Request) {
  const user = req.user;
  if (!user) throw new UnauthorizedError();
  if (!user.tenantId) throw new BadRequestError('A school account is required');
  return { tenantId: user.tenantId, userId: user.id };
}

function getId(req: Request) {
  const { id } = req.params;
  if (typeof id !== 'string') throw new BadRequestError('Invalid notice ID');
  return id;
}

export const noticesController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const { query } = listNoticesSchema.parse({ query: req.query });
    const result = await noticesService.listNotices({
      tenantId: context.tenantId,
      ...query,
    });
    return ApiResponse.paginated(res, result.items, result.pagination, 'Notices fetched');
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const notice = await noticesService.getNoticeById(getId(req), context.tenantId);
    return ApiResponse.success(res, notice, 'Notice fetched');
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const notice = await noticesService.createNotice({
      tenantId: context.tenantId,
      createdBy: context.userId,
      data: req.body,
    });
    return ApiResponse.created(res, notice, 'Notice created');
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const notice = await noticesService.updateNotice({
      noticeId: getId(req),
      tenantId: context.tenantId,
      data: req.body,
    });
    return ApiResponse.success(res, notice, 'Notice updated');
  }),

  publish: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const notice = await noticesService.publishNotice(getId(req), context.tenantId);
    return ApiResponse.success(res, notice, 'Notice published');
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    await noticesService.deleteNotice(getId(req), context.tenantId);
    return ApiResponse.success(res, null, 'Notice deleted');
  }),
};
