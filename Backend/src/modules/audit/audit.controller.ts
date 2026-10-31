import type { Request, Response } from 'express';
import { BadRequestError, UnauthorizedError } from '../../lib/errors.js';
import { ApiResponse } from '../../lib/response.js';
import { asyncHandler } from '../../middleware/async-handler.js';
import { listAuditLogsSchema } from './audit.validator.js';
import * as auditService from './audit.service.js';

function getSchoolContext(req: Request) {
  const user = req.user;
  if (!user) throw new UnauthorizedError();
  if (!user.tenantId) throw new BadRequestError('A school account is required');
  return { tenantId: user.tenantId };
}

export const auditController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const { query } = listAuditLogsSchema.parse({ query: req.query });
    const result = await auditService.listAuditLogs({
      tenantId: context.tenantId,
      ...query,
    });
    return ApiResponse.paginated(
      res,
      result.items,
      result.pagination,
      'Audit logs fetched',
    );
  }),
};
