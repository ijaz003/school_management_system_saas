import type { Request, Response } from 'express';
import { BadRequestError, UnauthorizedError } from '../../lib/errors.js';
import { ApiResponse } from '../../lib/response.js';
import { asyncHandler } from '../../middleware/async-handler.js';
import { listExamsSchema, marksSheetSchema } from './exams.validator.js';
import * as examsService from './exams.service.js';

function getSchoolContext(req: Request) {
  const user = req.user;
  if (!user) throw new UnauthorizedError();
  if (!user.tenantId) throw new BadRequestError('A school account is required');
  return { tenantId: user.tenantId, userId: user.id };
}

function getId(req: Request) {
  const { id } = req.params;
  if (typeof id !== 'string') throw new BadRequestError('Invalid exam ID');
  return id;
}

export const examsController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const { query } = listExamsSchema.parse({ query: req.query });
    const result = await examsService.listExams({
      tenantId: context.tenantId,
      ...query,
    });
    return ApiResponse.paginated(res, result.items, result.pagination, 'Exams fetched');
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const exam = await examsService.getExamById(getId(req), context.tenantId);
    return ApiResponse.success(res, exam, 'Exam fetched');
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const exam = await examsService.createExam({
      tenantId: context.tenantId,
      createdBy: context.userId,
      data: req.body,
    });
    return ApiResponse.created(res, exam, 'Exam created');
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const exam = await examsService.updateExam({
      examId: getId(req),
      tenantId: context.tenantId,
      data: req.body,
    });
    return ApiResponse.success(res, exam, 'Exam updated');
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    await examsService.deleteExam(getId(req), context.tenantId);
    return ApiResponse.success(res, null, 'Exam deleted');
  }),

  setSubjects: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const exam = await examsService.setExamSubjects({
      examId: getId(req),
      tenantId: context.tenantId,
      subjects: req.body.subjects,
    });
    return ApiResponse.success(res, exam, 'Exam subjects updated');
  }),

  openMarks: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const exam = await examsService.openMarksEntry(getId(req), context.tenantId);
    return ApiResponse.success(res, exam, 'Marks entry opened');
  }),

  publish: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const exam = await examsService.publishExam(getId(req), context.tenantId);
    return ApiResponse.success(res, exam, 'Results published');
  }),

  marksSheet: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const { query } = marksSheetSchema.parse({
      params: req.params,
      query: req.query,
    });
    const sheet = await examsService.getMarksSheet({
      tenantId: context.tenantId,
      examId: getId(req),
      examSubjectId: query.examSubjectId,
      sectionId: query.sectionId,
    });
    return ApiResponse.success(res, sheet, 'Marks sheet fetched');
  }),

  saveMarks: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const sheet = await examsService.saveMarks({
      tenantId: context.tenantId,
      enteredBy: context.userId,
      examId: getId(req),
      examSubjectId: req.body.examSubjectId,
      sectionId: req.body.sectionId,
      records: req.body.records,
    });
    return ApiResponse.success(res, sheet, 'Marks saved');
  }),

  results: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const results = await examsService.getExamResults(getId(req), context.tenantId);
    return ApiResponse.success(res, results, 'Exam results fetched');
  }),
};
