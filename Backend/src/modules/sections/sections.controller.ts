import type { Request, Response } from 'express';
import { BadRequestError } from '../../lib/errors.js';
import { ApiResponse } from '../../lib/response.js';
import { asyncHandler } from '../../middleware/async-handler.js';
import * as sectionsService from './sections.service.js';

function getParam(value: string | string[] | undefined) {
  if (typeof value !== 'string') throw new BadRequestError('Invalid route parameter');
  return value;
}

export const sectionsController = {
  listByClass: asyncHandler(async (req: Request, res: Response) => {
    const items = await sectionsService.listSectionsByClass(
      getParam(req.params.classId),
      req.user!.tenantId!,
    );
    return ApiResponse.success(res, items, 'Sections fetched');
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const section = await sectionsService.getSectionById(getParam(req.params.id), req.user!.tenantId!);
    return ApiResponse.success(res, section, 'Section fetched');
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const section = await sectionsService.createSection({
      tenantId: req.user!.tenantId!,
      data: req.body,
    });
    return ApiResponse.created(res, section, 'Section created');
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const section = await sectionsService.updateSection({
      sectionId: getParam(req.params.id),
      tenantId: req.user!.tenantId!,
      data: req.body,
    });
    return ApiResponse.success(res, section, 'Section updated');
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    await sectionsService.deleteSection(getParam(req.params.id), req.user!.tenantId!);
    return ApiResponse.success(res, null, 'Section deleted');
  }),

  getSubjects: asyncHandler(async (req: Request, res: Response) => {
    const items = await sectionsService.getSectionSubjects(getParam(req.params.id), req.user!.tenantId!);
    return ApiResponse.success(res, items, 'Section subjects fetched');
  }),

  setSubjects: asyncHandler(async (req: Request, res: Response) => {
    const result = await sectionsService.setCustomSectionSubjects(
      getParam(req.params.id),
      req.user!.tenantId!,
      req.body.subjectIds,
    );
    return ApiResponse.success(res, result, 'Section subjects updated');
  }),
};
