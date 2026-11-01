import type { Request, Response } from 'express';
import { BadRequestError, UnauthorizedError } from '../../lib/errors.js';
import { ApiResponse } from '../../lib/response.js';
import { asyncHandler } from '../../middleware/async-handler.js';
import {
  getSheetSchema,
  saveSheetSchema,
  scanAttendanceSchema,
  summarySchema,
} from './attendance.validator.js';
import * as attendanceService from './attendance.service.js';
import { recordAuditFromRequest } from '../../lib/audit.js';

function getSchoolContext(req: Request) {
  const user = req.user;
  if (!user) throw new UnauthorizedError();
  if (!user.tenantId) throw new BadRequestError('A school account is required');
  return { tenantId: user.tenantId, userId: user.id };
}

export const attendanceController = {
  getSheet: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const { query } = getSheetSchema.parse({ query: req.query });
    const sheet = await attendanceService.getAttendanceSheet({
      tenantId: context.tenantId,
      sectionId: query.sectionId,
      date: query.date,
    });
    return ApiResponse.success(res, sheet, 'Attendance sheet fetched');
  }),

  saveSheet: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const { body } = saveSheetSchema.parse({ body: req.body });
    const sheet = await attendanceService.saveAttendanceSheet({
      tenantId: context.tenantId,
      markedBy: context.userId,
      sectionId: body.sectionId,
      date: body.date,
      records: body.records,
    });
    return ApiResponse.success(res, sheet, 'Attendance saved');
  }),

  summary: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const { query } = summarySchema.parse({ query: req.query });
    const summary = await attendanceService.getAttendanceSummary({
      tenantId: context.tenantId,
      sectionId: query.sectionId,
      from: query.from,
      to: query.to,
    });
    return ApiResponse.success(res, summary, 'Attendance summary fetched');
  }),

  scanConfig: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const { getSchoolSettings } = await import('../school/settings/settings.service.js');
    const settings = await getSchoolSettings(context.tenantId);
    return ApiResponse.success(
      res,
      { cardAttendanceEnabled: Boolean(settings.settings?.cardAttendanceEnabled) },
      'Scan config fetched',
    );
  }),

  scan: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const { body } = scanAttendanceSchema.parse({ body: req.body });
    const result = await attendanceService.scanCardAttendance({
      tenantId: context.tenantId,
      markedBy: context.userId,
      code: body.code,
      date: body.date,
      status: body.status,
    });
    if (result.created) {
      recordAuditFromRequest(req, {
        tenantId: context.tenantId,
        actorId: context.userId,
        action: 'attendance.scan',
        entityType: 'student',
        entityId: result.student.id,
        summary: `Card scan marked ${result.student.fullName} ${result.status}`,
        metadata: { date: result.date, code: result.student.cardCode },
      });
    }
    return ApiResponse.success(
      res,
      result,
      result.alreadyMarked ? 'Already marked today' : 'Attendance marked by scan',
    );
  }),
};
