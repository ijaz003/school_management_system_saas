import type { Request, Response } from 'express';
import { BadRequestError, UnauthorizedError } from '../../lib/errors.js';
import { ApiResponse } from '../../lib/response.js';
import { asyncHandler } from '../../middleware/async-handler.js';
import { listAssignmentsSchema, listTeachersSchema } from './teachers.validator.js';
import * as teachersService from './teachers.service.js';

function getSchoolContext(req: Request) {
  const user = req.user;
  if (!user) throw new UnauthorizedError();
  if (!user.tenantId) throw new BadRequestError('A school account is required');
  return { tenantId: user.tenantId };
}

function getParam(value: string | string[] | undefined, label: string) {
  if (typeof value !== 'string') throw new BadRequestError(`Invalid ${label}`);
  return value;
}

export const teachersController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const { query } = listTeachersSchema.parse({ query: req.query });
    const result = await teachersService.listTeachers({
      tenantId: context.tenantId,
      ...query,
      isActive: query.isActive === undefined ? undefined : query.isActive === 'true',
    });
    return ApiResponse.paginated(res, result.items, result.pagination, 'Teachers fetched');
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const teacher = await teachersService.getTeacherById(
      getParam(req.params.id, 'teacher ID'),
      context.tenantId,
    );
    return ApiResponse.success(res, teacher, 'Teacher fetched');
  }),

  listAssignments: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const { query } = listAssignmentsSchema.parse({ query: req.query });
    const items = await teachersService.listAssignments({
      tenantId: context.tenantId,
      ...query,
    });
    return ApiResponse.success(res, items, 'Assignments fetched');
  }),

  createAssignment: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const assignment = await teachersService.createAssignment({
      tenantId: context.tenantId,
      data: req.body,
    });
    return ApiResponse.created(res, assignment, 'Subject teacher assigned');
  }),

  deleteAssignment: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    await teachersService.deleteAssignment(getParam(req.params.id, 'assignment ID'), context.tenantId);
    return ApiResponse.success(res, null, 'Assignment removed');
  }),

  setClassTeacher: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const result = await teachersService.setClassTeacher({
      tenantId: context.tenantId,
      sectionId: getParam(req.params.sectionId, 'section ID'),
      teacherId: req.body.teacherId ?? null,
    });
    return ApiResponse.success(res, result, 'Class teacher updated');
  }),
};
