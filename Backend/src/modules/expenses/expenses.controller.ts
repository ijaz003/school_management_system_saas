import type { Request, Response } from 'express';
import { recordAuditFromRequest } from '../../lib/audit.js';
import { BadRequestError, UnauthorizedError } from '../../lib/errors.js';
import { ApiResponse } from '../../lib/response.js';
import { asyncHandler } from '../../middleware/async-handler.js';
import {
  listExpenseCategoriesSchema,
  listExpensesSchema,
} from './expenses.validator.js';
import * as expensesService from './expenses.service.js';

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

export const expensesController = {
  listCategories: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const { query } = listExpenseCategoriesSchema.parse({ query: req.query });
    const items = await expensesService.listCategories({
      tenantId: context.tenantId,
      activeOnly: query.activeOnly,
    });
    return ApiResponse.success(res, items, 'Expense categories fetched');
  }),

  createCategory: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const item = await expensesService.createCategory({
      tenantId: context.tenantId,
      data: req.body,
    });
    recordAuditFromRequest(req, {
      tenantId: context.tenantId,
      actorId: context.userId,
      action: 'expenses.category.create',
      entityType: 'expense_category',
      entityId: item.id,
      summary: `Created expense category "${item.name}"`,
    });
    return ApiResponse.created(res, item, 'Expense category created');
  }),

  updateCategory: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const item = await expensesService.updateCategory({
      categoryId: getId(req),
      tenantId: context.tenantId,
      data: req.body,
    });
    recordAuditFromRequest(req, {
      tenantId: context.tenantId,
      actorId: context.userId,
      action: 'expenses.category.update',
      entityType: 'expense_category',
      entityId: item.id,
      summary: `Updated expense category "${item.name}"`,
    });
    return ApiResponse.success(res, item, 'Expense category updated');
  }),

  deleteCategory: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const categoryId = getId(req);
    await expensesService.deleteCategory(categoryId, context.tenantId);
    recordAuditFromRequest(req, {
      tenantId: context.tenantId,
      actorId: context.userId,
      action: 'expenses.category.delete',
      entityType: 'expense_category',
      entityId: categoryId,
      summary: 'Deleted expense category',
    });
    return ApiResponse.success(res, null, 'Expense category deleted');
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const { query } = listExpensesSchema.parse({ query: req.query });
    const result = await expensesService.listExpenses({
      tenantId: context.tenantId,
      ...query,
    });
    return ApiResponse.success(
      res,
      {
        items: result.items,
        summary: result.summary,
        pagination: result.pagination,
      },
      'Expenses fetched',
    );
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const item = await expensesService.getExpense(getId(req), context.tenantId);
    return ApiResponse.success(res, item, 'Expense fetched');
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const item = await expensesService.createExpense({
      tenantId: context.tenantId,
      createdBy: context.userId,
      data: req.body,
    });
    recordAuditFromRequest(req, {
      tenantId: context.tenantId,
      actorId: context.userId,
      action: 'expenses.create',
      entityType: 'expense',
      entityId: item.id,
      summary: `Recorded expense "${item.title}" (${item.amount})`,
    });
    return ApiResponse.created(res, item, 'Expense created');
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const item = await expensesService.updateExpense({
      expenseId: getId(req),
      tenantId: context.tenantId,
      data: req.body,
    });
    recordAuditFromRequest(req, {
      tenantId: context.tenantId,
      actorId: context.userId,
      action: 'expenses.update',
      entityType: 'expense',
      entityId: item.id,
      summary: `Updated expense "${item.title}"`,
    });
    return ApiResponse.success(res, item, 'Expense updated');
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const expenseId = getId(req);
    await expensesService.deleteExpense(expenseId, context.tenantId);
    recordAuditFromRequest(req, {
      tenantId: context.tenantId,
      actorId: context.userId,
      action: 'expenses.delete',
      entityType: 'expense',
      entityId: expenseId,
      summary: 'Deleted expense',
    });
    return ApiResponse.success(res, null, 'Expense deleted');
  }),
};
