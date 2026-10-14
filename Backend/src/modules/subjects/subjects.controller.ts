import type { Request, Response } from 'express';
import { BadRequestError } from '../../lib/errors.js';
import { ApiResponse } from '../../lib/response.js';
import { asyncHandler } from '../../middleware/async-handler.js';
import * as subjectsService from './subjects.service.js';

function getParam(value: string | string[] | undefined) {
  if (typeof value !== 'string') throw new BadRequestError('Invalid route parameter');
  return value;
}

export const subjectsController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const items = await subjectsService.listSubjects({
      tenantId: req.user!.tenantId!,
      search: typeof req.query.search === 'string' ? req.query.search : undefined,
    });
    return ApiResponse.success(res, items, 'Subjects fetched');
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const subject = await subjectsService.getSubjectById(getParam(req.params.id), req.user!.tenantId!);
    return ApiResponse.success(res, subject, 'Subject fetched');
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const subject = await subjectsService.createSubject({
      tenantId: req.user!.tenantId!,
      data: req.body,
    });
    return ApiResponse.created(res, subject, 'Subject created');
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const subject = await subjectsService.updateSubject({
      subjectId: getParam(req.params.id),
      tenantId: req.user!.tenantId!,
      data: req.body,
    });
    return ApiResponse.success(res, subject, 'Subject updated');
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    await subjectsService.deleteSubject(getParam(req.params.id), req.user!.tenantId!);
    return ApiResponse.success(res, null, 'Subject deleted');
  }),
};
