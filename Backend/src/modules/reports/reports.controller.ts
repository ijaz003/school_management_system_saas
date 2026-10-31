import type { Request, Response } from 'express';
import { BadRequestError, UnauthorizedError } from '../../lib/errors.js';
import { ApiResponse } from '../../lib/response.js';
import { asyncHandler } from '../../middleware/async-handler.js';
import {
  academicReportSchema,
  attendanceReportSchema,
  feesReportSchema,
} from './reports.validator.js';
import * as reportsService from './reports.service.js';

function getTenantId(req: Request) {
  const user = req.user;
  if (!user) throw new UnauthorizedError();
  if (!user.tenantId) throw new BadRequestError('A school account is required');
  return user.tenantId;
}

export const reportsController = {
  fees: asyncHandler(async (req: Request, res: Response) => {
    const { query } = feesReportSchema.parse({ query: req.query });
    const report = await reportsService.getFeesReport({
      tenantId: getTenantId(req),
      ...query,
    });
    return ApiResponse.success(res, report, 'Fees report fetched');
  }),

  attendance: asyncHandler(async (req: Request, res: Response) => {
    const { query } = attendanceReportSchema.parse({ query: req.query });
    const report = await reportsService.getAttendanceReport({
      tenantId: getTenantId(req),
      ...query,
    });
    return ApiResponse.success(res, report, 'Attendance report fetched');
  }),

  academic: asyncHandler(async (req: Request, res: Response) => {
    const { query } = academicReportSchema.parse({ query: req.query });
    const report = await reportsService.getAcademicReport({
      tenantId: getTenantId(req),
      ...query,
    });
    return ApiResponse.success(res, report, 'Academic report fetched');
  }),
};
