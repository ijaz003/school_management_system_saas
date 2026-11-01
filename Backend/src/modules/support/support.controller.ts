import type { Request, Response } from 'express';
import { BadRequestError, UnauthorizedError } from '../../lib/errors.js';
import { ApiResponse } from '../../lib/response.js';
import { asyncHandler } from '../../middleware/async-handler.js';
import { listSupportTicketsSchema } from './support.validator.js';
import * as supportService from './support.service.js';

function getUser(req: Request) {
  const user = req.user;
  if (!user) throw new UnauthorizedError();
  return user;
}

function getSchoolContext(req: Request) {
  const user = getUser(req);
  if (!user.tenantId) throw new BadRequestError('A school account is required');
  return { tenantId: user.tenantId, userId: user.id, role: user.role };
}

function getId(req: Request) {
  const { id } = req.params;
  if (typeof id !== 'string') throw new BadRequestError('Invalid ticket ID');
  return id;
}

export const schoolSupportController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const { query } = listSupportTicketsSchema.parse({ query: req.query });
    const result = await supportService.listTickets({
      tenantId: context.tenantId,
      page: query.page,
      limit: query.limit,
      search: query.search,
      status: query.status,
      category: query.category,
      priority: query.priority,
    });
    return ApiResponse.paginated(res, result.items, result.pagination, 'Support tickets fetched');
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const detail = await supportService.getTicketDetail(getId(req), {
      tenantId: context.tenantId,
      includeInternal: false,
    });
    return ApiResponse.success(res, detail, 'Support ticket fetched');
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const detail = await supportService.createTicket({
      tenantId: context.tenantId,
      createdBy: context.userId,
      data: req.body,
    });
    return ApiResponse.created(res, detail, 'Support ticket created');
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const detail = await supportService.updateTicket({
      ticketId: getId(req),
      tenantId: context.tenantId,
      data: req.body,
      actorRole: context.role,
    });
    return ApiResponse.success(res, detail, 'Support ticket updated');
  }),

  addMessage: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const detail = await supportService.addMessage({
      ticketId: getId(req),
      tenantId: context.tenantId,
      authorId: context.userId,
      actorRole: context.role,
      data: req.body,
    });
    return ApiResponse.success(res, detail, 'Message added');
  }),
};

export const platformSupportController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    getUser(req);
    const { query } = listSupportTicketsSchema.parse({ query: req.query });
    const result = await supportService.listTickets({
      tenantId: query.tenantId,
      page: query.page,
      limit: query.limit,
      search: query.search,
      status: query.status,
      category: query.category,
      priority: query.priority,
    });
    return ApiResponse.paginated(res, result.items, result.pagination, 'Support inbox fetched');
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    getUser(req);
    const detail = await supportService.getTicketDetail(getId(req), {
      includeInternal: true,
    });
    return ApiResponse.success(res, detail, 'Support ticket fetched');
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const user = getUser(req);
    const detail = await supportService.updateTicket({
      ticketId: getId(req),
      data: req.body,
      actorRole: user.role,
    });
    return ApiResponse.success(res, detail, 'Support ticket updated');
  }),

  addMessage: asyncHandler(async (req: Request, res: Response) => {
    const user = getUser(req);
    const detail = await supportService.addMessage({
      ticketId: getId(req),
      authorId: user.id,
      actorRole: user.role,
      data: req.body,
    });
    return ApiResponse.success(res, detail, 'Message added');
  }),
};
