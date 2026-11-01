import type { Request, Response } from 'express';
import { BadRequestError, UnauthorizedError } from '../../lib/errors.js';
import { ApiResponse } from '../../lib/response.js';
import { asyncHandler } from '../../middleware/async-handler.js';
import { listStudentsSchema } from './students.validator.js';
import * as studentsService from './students.service.js';

function getSchoolContext(req: Request) {
  const user = req.user;
  if (!user) throw new UnauthorizedError();
  if (!user.tenantId) throw new BadRequestError('A school account is required');
  return { tenantId: user.tenantId, userId: user.id };
}

function getStudentId(req: Request): string {
  const { id } = req.params;
  if (typeof id !== 'string') throw new BadRequestError('Invalid student ID');
  return id;
}

export const studentsController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const { query } = listStudentsSchema.parse({ query: req.query });
    const result = await studentsService.listStudents({
      tenantId: context.tenantId,
      ...query,
    });
    return ApiResponse.paginated(res, result.items, result.pagination, 'Students fetched');
  }),

  idCards: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const classId =
      typeof req.query.classId === 'string' ? req.query.classId : undefined;
    const sectionId =
      typeof req.query.sectionId === 'string' ? req.query.sectionId : undefined;
    const data = await studentsService.listIdCardStudents({
      tenantId: context.tenantId,
      classId,
      sectionId,
    });
    return ApiResponse.success(res, data, 'ID cards fetched');
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const student = await studentsService.getStudentById(getStudentId(req), context.tenantId);
    return ApiResponse.success(res, student, 'Student fetched');
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const student = await studentsService.createStudent({
      tenantId: context.tenantId,
      data: req.body,
    });
    return ApiResponse.created(res, student, 'Student created successfully');
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const student = await studentsService.updateStudent({
      studentId: getStudentId(req),
      tenantId: context.tenantId,
      data: req.body,
    });
    return ApiResponse.success(res, student, 'Student updated');
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    await studentsService.deleteStudent(getStudentId(req), context.tenantId);
    return ApiResponse.success(res, null, 'Student deleted');
  }),
};
