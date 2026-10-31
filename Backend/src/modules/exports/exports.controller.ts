import type { Request, Response } from 'express';
import { BadRequestError, UnauthorizedError } from '../../lib/errors.js';
import { sendCsv } from '../../lib/csv.js';
import { asyncHandler } from '../../middleware/async-handler.js';
import {
  exportExamMarksSchema,
  exportInvoicesSchema,
  exportStudentsSchema,
} from './exports.validator.js';
import * as exportsService from './exports.service.js';

function getSchoolContext(req: Request) {
  const user = req.user;
  if (!user) throw new UnauthorizedError();
  if (!user.tenantId) throw new BadRequestError('A school account is required');
  return { tenantId: user.tenantId };
}

export const exportsController = {
  students: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const { query } = exportStudentsSchema.parse({ query: req.query });
    const csv = await exportsService.exportStudentsCsv({
      tenantId: context.tenantId,
      ...query,
    });
    return sendCsv(res, 'students.csv', csv);
  }),

  invoices: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const { query } = exportInvoicesSchema.parse({ query: req.query });
    const csv = await exportsService.exportInvoicesCsv({
      tenantId: context.tenantId,
      ...query,
    });
    return sendCsv(res, 'fee-invoices.csv', csv);
  }),

  examMarks: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const { params } = exportExamMarksSchema.parse({ params: req.params });
    const { csv, filename } = await exportsService.exportExamMarksCsv(
      params.examId,
      context.tenantId,
    );
    return sendCsv(res, filename, csv);
  }),
};
