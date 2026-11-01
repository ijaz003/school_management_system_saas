import type { Request, Response } from 'express';
import { BadRequestError, UnauthorizedError } from '../../lib/errors.js';
import { ApiResponse } from '../../lib/response.js';
import { asyncHandler } from '../../middleware/async-handler.js';
import { listPlacementsSchema, promoteStudentsSchema } from './session-years.validator.js';
import * as sessionYearsService from './session-years.service.js';

function getSchoolContext(req: Request) {
  const user = req.user;
  if (!user) throw new UnauthorizedError();
  if (!user.tenantId) throw new BadRequestError('A school account is required');
  return { tenantId: user.tenantId, userId: user.id };
}

function getId(req: Request) {
  const { id } = req.params;
  if (typeof id !== 'string') throw new BadRequestError('Invalid session year ID');
  return id;
}

export const sessionYearsController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getSchoolContext(req);
    const items = await sessionYearsService.listSessionYears(tenantId);
    return ApiResponse.success(res, items, 'Session years fetched');
  }),

  current: asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getSchoolContext(req);
    const item = await sessionYearsService.getCurrentSessionYear(tenantId);
    return ApiResponse.success(res, item, 'Current session year fetched');
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getSchoolContext(req);
    const item = await sessionYearsService.getSessionYearById(getId(req), tenantId);
    return ApiResponse.success(res, item, 'Session year fetched');
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getSchoolContext(req);
    const item = await sessionYearsService.createSessionYear(tenantId, req.body);
    return ApiResponse.created(res, item, 'Session year created');
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getSchoolContext(req);
    const item = await sessionYearsService.updateSessionYear(getId(req), tenantId, req.body);
    return ApiResponse.success(res, item, 'Session year updated');
  }),

  setCurrent: asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getSchoolContext(req);
    const item = await sessionYearsService.setSessionYearCurrent(getId(req), tenantId);
    return ApiResponse.success(res, item, 'Current session year updated');
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getSchoolContext(req);
    await sessionYearsService.deleteSessionYear(getId(req), tenantId);
    return ApiResponse.success(res, null, 'Session year deleted');
  }),

  listPlacements: asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getSchoolContext(req);
    const { query } = listPlacementsSchema.parse({ query: req.query });
    const items = await sessionYearsService.listPlacements(tenantId, query);
    return ApiResponse.success(res, items, 'Placements fetched');
  }),

  promotionPreview: asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getSchoolContext(req);
    const fromSessionYearId =
      typeof req.query.fromSessionYearId === 'string' ? req.query.fromSessionYearId : '';
    const fromClassId = typeof req.query.fromClassId === 'string' ? req.query.fromClassId : '';
    const toClassId = typeof req.query.toClassId === 'string' ? req.query.toClassId : undefined;
    if (!fromSessionYearId || !fromClassId) {
      throw new BadRequestError('fromSessionYearId and fromClassId are required');
    }
    const preview = await sessionYearsService.getPromotionPreview({
      tenantId,
      fromSessionYearId,
      fromClassId,
      toClassId,
    });
    return ApiResponse.success(res, preview, 'Promotion preview fetched');
  }),

  promote: asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getSchoolContext(req);
    const { body } = promoteStudentsSchema.parse({ body: req.body });
    const result = await sessionYearsService.promoteStudents(tenantId, body);
    return ApiResponse.success(res, result, 'Promotion completed');
  }),
};
