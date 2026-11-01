import type { Request, Response } from 'express';
import { BadRequestError, UnauthorizedError } from '../../lib/errors.js';
import { ApiResponse } from '../../lib/response.js';
import { asyncHandler } from '../../middleware/async-handler.js';
import { listDiarySchema } from './diary.validator.js';
import * as diaryService from './diary.service.js';

function getSchoolContext(req: Request) {
  const user = req.user;
  if (!user) throw new UnauthorizedError();
  if (!user.tenantId) throw new BadRequestError('A school account is required');
  return { tenantId: user.tenantId, userId: user.id };
}

function getId(req: Request) {
  const { id } = req.params;
  if (typeof id !== 'string') throw new BadRequestError('Invalid diary entry ID');
  return id;
}

export const diaryController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const { query } = listDiarySchema.parse({ query: req.query });
    const result = await diaryService.listDiaryEntries({
      tenantId: context.tenantId,
      ...query,
    });
    return ApiResponse.paginated(res, result.items, result.pagination, 'Diary entries fetched');
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const entry = await diaryService.getDiaryEntryById(getId(req), context.tenantId);
    return ApiResponse.success(res, entry, 'Diary entry fetched');
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const entry = await diaryService.createDiaryEntry({
      tenantId: context.tenantId,
      createdBy: context.userId,
      data: req.body,
    });
    return ApiResponse.created(res, entry, 'Diary entry created');
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const entry = await diaryService.updateDiaryEntry({
      entryId: getId(req),
      tenantId: context.tenantId,
      data: req.body,
    });
    return ApiResponse.success(res, entry, 'Diary entry updated');
  }),

  publish: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const entry = await diaryService.publishDiaryEntry(getId(req), context.tenantId);
    return ApiResponse.success(res, entry, 'Diary entry published');
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    await diaryService.deleteDiaryEntry(getId(req), context.tenantId);
    return ApiResponse.success(res, null, 'Diary entry deleted');
  }),
};
