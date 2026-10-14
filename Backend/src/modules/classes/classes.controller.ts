import type { Request, Response } from 'express';
import { BadRequestError } from '../../lib/errors.js';
import { ApiResponse } from '../../lib/response.js';
import { asyncHandler } from '../../middleware/async-handler.js';
import * as classesService from './classes.service.js';

function getParam(value: string | string[] | undefined) {
  if (typeof value !== 'string') throw new BadRequestError('Invalid route parameter');
  return value;
}

export const classesController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const items = await classesService.listClasses({
      tenantId: req.user!.tenantId!,
      search: typeof req.query.search === 'string' ? req.query.search : undefined,
    });
    return ApiResponse.success(res, items, 'Classes fetched');
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const classRow = await classesService.getClassById(getParam(req.params.id), req.user!.tenantId!);
    return ApiResponse.success(res, classRow, 'Class fetched');
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const classRow = await classesService.createClass({
      tenantId: req.user!.tenantId!,
      data: req.body,
    });
    return ApiResponse.created(res, classRow, 'Class created');
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const classRow = await classesService.updateClass({
      classId: getParam(req.params.id),
      tenantId: req.user!.tenantId!,
      data: req.body,
    });
    return ApiResponse.success(res, classRow, 'Class updated');
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    await classesService.deleteClass(getParam(req.params.id), req.user!.tenantId!);
    return ApiResponse.success(res, null, 'Class deleted');
  }),

  addSubjects: asyncHandler(async (req: Request, res: Response) => {
    const result = await classesService.addSubjectsToClass(
      getParam(req.params.id),
      req.user!.tenantId!,
      req.body.subjectIds,
    );
    return ApiResponse.success(res, result, 'Subjects added to class');
  }),

  removeSubject: asyncHandler(async (req: Request, res: Response) => {
    await classesService.removeSubjectFromClass(
      getParam(req.params.id),
      getParam(req.params.subjectId),
      req.user!.tenantId!,
    );
    return ApiResponse.success(res, null, 'Subject removed from class');
  }),
};
