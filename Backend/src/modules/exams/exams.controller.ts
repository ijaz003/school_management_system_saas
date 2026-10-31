import type { Request, Response } from 'express';
import { recordAuditFromRequest } from '../../lib/audit.js';
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
    recordAuditFromRequest(req, {
      tenantId: context.tenantId,
      actorId: context.userId,
      action: 'exams.create',
      entityType: 'exam',
      entityId: exam.id,
      summary: `Created exam "${exam.name}"`,
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
    recordAuditFromRequest(req, {
      tenantId: context.tenantId,
      actorId: context.userId,
      action: 'exams.update',
      entityType: 'exam',
      entityId: exam.id,
      summary: `Updated exam "${exam.name}"`,
    });
    return ApiResponse.success(res, exam, 'Exam updated');
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const examId = getId(req);
    await examsService.deleteExam(examId, context.tenantId);
    recordAuditFromRequest(req, {
      tenantId: context.tenantId,
      actorId: context.userId,
      action: 'exams.delete',
      entityType: 'exam',
      entityId: examId,
      summary: 'Deleted exam',
    });
    return ApiResponse.success(res, null, 'Exam deleted');
  }),

  setSubjects: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const exam = await examsService.setExamSubjects({
      examId: getId(req),
      tenantId: context.tenantId,
      subjects: req.body.subjects,
    });
    recordAuditFromRequest(req, {
      tenantId: context.tenantId,
      actorId: context.userId,
      action: 'exams.subjects.set',
      entityType: 'exam',
      entityId: exam.id,
      summary: `Set subjects on exam "${exam.name}"`,
      metadata: { subjectCount: req.body.subjects?.length ?? 0 },
    });
    return ApiResponse.success(res, exam, 'Exam subjects updated');
  }),

  openMarks: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const exam = await examsService.openMarksEntry(getId(req), context.tenantId);
    recordAuditFromRequest(req, {
      tenantId: context.tenantId,
      actorId: context.userId,
      action: 'exams.marks.open',
      entityType: 'exam',
      entityId: exam.id,
      summary: `Opened marks entry for "${exam.name}"`,
    });
    return ApiResponse.success(res, exam, 'Marks entry opened');
  }),

  publish: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const exam = await examsService.publishExam(getId(req), context.tenantId);
    recordAuditFromRequest(req, {
      tenantId: context.tenantId,
      actorId: context.userId,
      action: 'exams.publish',
      entityType: 'exam',
      entityId: exam.id,
      summary: `Published results for "${exam.name}"`,
    });
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
    const examId = getId(req);
    const sheet = await examsService.saveMarks({
      tenantId: context.tenantId,
      enteredBy: context.userId,
      examId,
      examSubjectId: req.body.examSubjectId,
      sectionId: req.body.sectionId,
      records: req.body.records,
    });
    recordAuditFromRequest(req, {
      tenantId: context.tenantId,
      actorId: context.userId,
      action: 'exams.marks.save',
      entityType: 'exam',
      entityId: examId,
      summary: `Saved marks for ${req.body.records?.length ?? 0} students`,
      metadata: {
        examSubjectId: req.body.examSubjectId,
        sectionId: req.body.sectionId,
      },
    });
    return ApiResponse.success(res, sheet, 'Marks saved');
  }),

  results: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const results = await examsService.getExamResults(getId(req), context.tenantId);
    return ApiResponse.success(res, results, 'Exam results fetched');
  }),

  reportCards: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const data = await examsService.getExamReportCards(getId(req), context.tenantId);
    return ApiResponse.success(res, data, 'Report cards fetched');
  }),

  reportCard: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const studentId = req.params.studentId;
    if (typeof studentId !== 'string') throw new BadRequestError('Invalid student ID');
    const data = await examsService.getStudentReportCard(
      getId(req),
      studentId,
      context.tenantId,
    );
    return ApiResponse.success(res, data, 'Report card fetched');
  }),
};
