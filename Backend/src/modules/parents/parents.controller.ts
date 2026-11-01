import type { Request, Response } from 'express';
import { recordAuditFromRequest } from '../../lib/audit.js';
import { BadRequestError, UnauthorizedError } from '../../lib/errors.js';
import { ApiResponse } from '../../lib/response.js';
import { asyncHandler } from '../../middleware/async-handler.js';
import { listParentsSchema } from './parents.validator.js';
import * as parentsService from './parents.service.js';
import * as parentPortalService from './parent-portal.service.js';

function getSchoolAdminContext(req: Request) {
  const user = req.user;
  if (!user) throw new UnauthorizedError();
  if (!user.tenantId) throw new BadRequestError('A school account is required');
  return {
    tenantId: user.tenantId,
    userId: user.id,
    permissions: user.permissions,
  };
}

function getId(req: Request, key = 'id') {
  const value = req.params[key];
  if (typeof value !== 'string') throw new BadRequestError('Invalid ID');
  return value;
}

export const parentsController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolAdminContext(req);
    const { query } = listParentsSchema.parse({ query: req.query });
    const result = await parentsService.listParents({
      tenantId: context.tenantId,
      ...query,
    });
    return ApiResponse.paginated(res, result.items, result.pagination, 'Parents fetched');
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolAdminContext(req);
    const parent = await parentsService.getParent(getId(req), context.tenantId);
    return ApiResponse.success(res, parent, 'Parent fetched');
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolAdminContext(req);
    const result = await parentsService.createParent({
      tenantId: context.tenantId,
      createdBy: context.userId,
      adminPermissions: context.permissions,
      data: req.body,
    });
    recordAuditFromRequest(req, {
      tenantId: context.tenantId,
      actorId: context.userId,
      action: 'parents.create',
      entityType: 'parent',
      entityId: result.parent.id,
      summary: `Created parent portal user "${result.parent.fullName}"`,
    });
    return ApiResponse.created(res, result, 'Parent created');
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolAdminContext(req);
    const parent = await parentsService.updateParent({
      parentId: getId(req),
      tenantId: context.tenantId,
      data: req.body,
    });
    recordAuditFromRequest(req, {
      tenantId: context.tenantId,
      actorId: context.userId,
      action: 'parents.update',
      entityType: 'parent',
      entityId: parent.id,
      summary: `Updated parent "${parent.fullName}"`,
    });
    return ApiResponse.success(res, parent, 'Parent updated');
  }),

  linkStudents: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolAdminContext(req);
    const parent = await parentsService.linkStudents({
      parentId: getId(req),
      tenantId: context.tenantId,
      studentIds: req.body.studentIds,
    });
    recordAuditFromRequest(req, {
      tenantId: context.tenantId,
      actorId: context.userId,
      action: 'parents.link',
      entityType: 'parent',
      entityId: parent.id,
      summary: `Linked students to parent "${parent.fullName}"`,
    });
    return ApiResponse.success(res, parent, 'Students linked');
  }),

  unlinkStudent: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolAdminContext(req);
    const parent = await parentsService.unlinkStudent({
      parentId: getId(req),
      tenantId: context.tenantId,
      studentId: getId(req, 'studentId'),
    });
    recordAuditFromRequest(req, {
      tenantId: context.tenantId,
      actorId: context.userId,
      action: 'parents.unlink',
      entityType: 'parent',
      entityId: parent.id,
      summary: `Unlinked student from parent "${parent.fullName}"`,
    });
    return ApiResponse.success(res, parent, 'Student unlinked');
  }),

  resetPassword: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolAdminContext(req);
    const result = await parentsService.resetParentPassword(getId(req), context.tenantId);
    recordAuditFromRequest(req, {
      tenantId: context.tenantId,
      actorId: context.userId,
      action: 'parents.reset_password',
      entityType: 'parent',
      entityId: result.parentId,
      summary: `Reset parent password for ${result.email}`,
    });
    return ApiResponse.success(res, result, 'Password reset');
  }),
};

export const parentPortalController = {
  home: asyncHandler(async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) throw new UnauthorizedError();
    const context = await parentPortalService.requireParentActor(user);
    const data = await parentPortalService.getPortalHome(context.userId, context.tenantId);
    return ApiResponse.success(res, data, 'Parent portal home');
  }),

  attendance: asyncHandler(async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) throw new UnauthorizedError();
    const context = await parentPortalService.requireParentActor(user);
    const data = await parentPortalService.getChildAttendance({
      parentUserId: context.userId,
      tenantId: context.tenantId,
      studentId: getId(req, 'studentId'),
      from: typeof req.query.from === 'string' ? req.query.from : undefined,
      to: typeof req.query.to === 'string' ? req.query.to : undefined,
    });
    return ApiResponse.success(res, data, 'Child attendance fetched');
  }),

  fees: asyncHandler(async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) throw new UnauthorizedError();
    const context = await parentPortalService.requireParentActor(user);
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const data = await parentPortalService.getChildFees({
      parentUserId: context.userId,
      tenantId: context.tenantId,
      studentId: getId(req, 'studentId'),
      page,
      limit,
    });
    return ApiResponse.paginated(res, data.items, data.pagination, 'Child fees fetched');
  }),

  diary: asyncHandler(async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) throw new UnauthorizedError();
    const context = await parentPortalService.requireParentActor(user);
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const data = await parentPortalService.getChildDiary({
      parentUserId: context.userId,
      tenantId: context.tenantId,
      studentId: getId(req, 'studentId'),
      page,
      limit,
    });
    return ApiResponse.paginated(res, data.items, data.pagination, 'Child diary fetched');
  }),

  notices: asyncHandler(async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) throw new UnauthorizedError();
    const context = await parentPortalService.requireParentActor(user);
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const data = await parentPortalService.listParentNotices({
      tenantId: context.tenantId,
      page,
      limit,
    });
    return ApiResponse.paginated(res, data.items, data.pagination, 'Notices fetched');
  }),

  results: asyncHandler(async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) throw new UnauthorizedError();
    const context = await parentPortalService.requireParentActor(user);
    const data = await parentPortalService.getChildResults({
      parentUserId: context.userId,
      tenantId: context.tenantId,
      studentId: getId(req, 'studentId'),
    });
    return ApiResponse.success(res, data, 'Child results fetched');
  }),
};
