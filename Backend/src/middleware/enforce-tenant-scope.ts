import type { RequestHandler } from 'express';
import { ApiResponse } from '../lib/response.js';

function getRequestedTenantIds(req: Parameters<RequestHandler>[0]): unknown[] {
  return [
    req.body?.tenantId,
    req.query.tenantId,
    req.params.tenantId,
  ].filter((tenantId) => tenantId !== undefined && tenantId !== null);
}

export const enforceTenantScope: RequestHandler = (req, res, next) => {
  if (!req.user) {
    return ApiResponse.error(res, 'Authentication required', 401);
  }

  if (req.user.role === 'super_admin') {
    return next();
  }

  if (!req.user.tenantId) {
    return ApiResponse.error(
      res,
      'No tenant associated with your account',
      403,
    );
  }

  const requestedTenantIds = getRequestedTenantIds(req);

  if (
    requestedTenantIds.some(
      (tenantId) =>
        typeof tenantId !== 'string' || tenantId !== req.user!.tenantId,
    ) ||
    (req.tenantId != null && req.tenantId !== req.user.tenantId) ||
    (req.tenant?.id !== undefined && req.tenant.id !== req.user.tenantId)
  ) {
    return ApiResponse.error(res, 'Cross-tenant access denied', 403);
  }

  req.tenantId = req.user.tenantId;
  return next();
};
