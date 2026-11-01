import type { Request, Response } from 'express';
import { recordAuditFromRequest } from '../../lib/audit.js';
import { BadRequestError, UnauthorizedError } from '../../lib/errors.js';
import { ApiResponse } from '../../lib/response.js';
import { asyncHandler } from '../../middleware/async-handler.js';
import { listTimetableSchema } from './timetable.validator.js';
import * as timetableService from './timetable.service.js';

function getSchoolContext(req: Request) {
  const user = req.user;
  if (!user) throw new UnauthorizedError();
  if (!user.tenantId) throw new BadRequestError('A school account is required');
  return { tenantId: user.tenantId, userId: user.id };
}

function getId(req: Request) {
  const { id } = req.params;
  if (typeof id !== 'string') throw new BadRequestError('Invalid ID');
  return id;
}

export const timetableController = {
  listPeriods: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const items = await timetableService.listPeriods(context.tenantId);
    return ApiResponse.success(res, items, 'Timetable periods fetched');
  }),

  createPeriod: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const item = await timetableService.createPeriod({
      tenantId: context.tenantId,
      data: req.body,
    });
    recordAuditFromRequest(req, {
      tenantId: context.tenantId,
      actorId: context.userId,
      action: 'timetable.period.create',
      entityType: 'timetable_period',
      entityId: item.id,
      summary: `Created timetable period "${item.name}"`,
    });
    return ApiResponse.created(res, item, 'Timetable period created');
  }),

  updatePeriod: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const item = await timetableService.updatePeriod({
      periodId: getId(req),
      tenantId: context.tenantId,
      data: req.body,
    });
    recordAuditFromRequest(req, {
      tenantId: context.tenantId,
      actorId: context.userId,
      action: 'timetable.period.update',
      entityType: 'timetable_period',
      entityId: item.id,
      summary: `Updated timetable period "${item.name}"`,
    });
    return ApiResponse.success(res, item, 'Timetable period updated');
  }),

  deletePeriod: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const periodId = getId(req);
    await timetableService.deletePeriod(periodId, context.tenantId);
    recordAuditFromRequest(req, {
      tenantId: context.tenantId,
      actorId: context.userId,
      action: 'timetable.period.delete',
      entityType: 'timetable_period',
      entityId: periodId,
      summary: 'Deleted timetable period',
    });
    return ApiResponse.success(res, null, 'Timetable period deleted');
  }),

  getSectionTimetable: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const { query } = listTimetableSchema.parse({ query: req.query });
    const data = await timetableService.getSectionTimetable(
      query.sectionId,
      context.tenantId,
    );
    return ApiResponse.success(res, data, 'Timetable fetched');
  }),

  upsertEntry: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const item = await timetableService.upsertEntry({
      tenantId: context.tenantId,
      data: req.body,
    });
    recordAuditFromRequest(req, {
      tenantId: context.tenantId,
      actorId: context.userId,
      action: 'timetable.entry.upsert',
      entityType: 'timetable_entry',
      entityId: item?.id ?? req.body.periodId,
      summary: item
        ? `Updated timetable slot (day ${req.body.dayOfWeek})`
        : `Cleared timetable slot (day ${req.body.dayOfWeek})`,
    });
    return ApiResponse.success(res, item, item ? 'Timetable entry saved' : 'Timetable slot cleared');
  }),

  updateEntry: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const item = await timetableService.updateEntry({
      entryId: getId(req),
      tenantId: context.tenantId,
      data: req.body,
    });
    recordAuditFromRequest(req, {
      tenantId: context.tenantId,
      actorId: context.userId,
      action: 'timetable.entry.update',
      entityType: 'timetable_entry',
      entityId: item.id,
      summary: 'Updated timetable entry',
    });
    return ApiResponse.success(res, item, 'Timetable entry updated');
  }),

  deleteEntry: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const entryId = getId(req);
    await timetableService.deleteEntry(entryId, context.tenantId);
    recordAuditFromRequest(req, {
      tenantId: context.tenantId,
      actorId: context.userId,
      action: 'timetable.entry.delete',
      entityType: 'timetable_entry',
      entityId: entryId,
      summary: 'Deleted timetable entry',
    });
    return ApiResponse.success(res, null, 'Timetable entry deleted');
  }),
};
