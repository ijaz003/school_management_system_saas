import type { Request, Response } from 'express';
import { recordAuditFromRequest } from '../../lib/audit.js';
import { BadRequestError, UnauthorizedError } from '../../lib/errors.js';
import { ApiResponse } from '../../lib/response.js';
import { asyncHandler } from '../../middleware/async-handler.js';
import { listFeeStructuresSchema, listInvoicesSchema } from './fees.validator.js';
import * as feesService from './fees.service.js';

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

export const feesController = {
  listStructures: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const { query } = listFeeStructuresSchema.parse({ query: req.query });
    const items = await feesService.listFeeStructures({
      tenantId: context.tenantId,
      ...query,
    });
    return ApiResponse.success(res, items, 'Fee structures fetched');
  }),

  createStructure: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const item = await feesService.createFeeStructure({
      tenantId: context.tenantId,
      data: req.body,
    });
    recordAuditFromRequest(req, {
      tenantId: context.tenantId,
      actorId: context.userId,
      action: 'fees.structure.create',
      entityType: 'fee_structure',
      entityId: item.id,
      summary: `Created fee structure "${item.name}"`,
    });
    return ApiResponse.created(res, item, 'Fee structure created');
  }),

  updateStructure: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const item = await feesService.updateFeeStructure({
      structureId: getId(req),
      tenantId: context.tenantId,
      data: req.body,
    });
    recordAuditFromRequest(req, {
      tenantId: context.tenantId,
      actorId: context.userId,
      action: 'fees.structure.update',
      entityType: 'fee_structure',
      entityId: item.id,
      summary: `Updated fee structure "${item.name}"`,
    });
    return ApiResponse.success(res, item, 'Fee structure updated');
  }),

  deleteStructure: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const structureId = getId(req);
    await feesService.deleteFeeStructure(structureId, context.tenantId);
    recordAuditFromRequest(req, {
      tenantId: context.tenantId,
      actorId: context.userId,
      action: 'fees.structure.delete',
      entityType: 'fee_structure',
      entityId: structureId,
      summary: 'Deleted fee structure',
    });
    return ApiResponse.success(res, null, 'Fee structure deleted');
  }),

  listInvoices: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const { query } = listInvoicesSchema.parse({ query: req.query });
    const result = await feesService.listInvoices({
      tenantId: context.tenantId,
      ...query,
    });
    return ApiResponse.paginated(res, result.items, result.pagination, 'Invoices fetched');
  }),

  getInvoice: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const invoice = await feesService.getInvoiceById(getId(req), context.tenantId);
    return ApiResponse.success(res, invoice, 'Invoice fetched');
  }),

  createInvoice: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const invoice = await feesService.createInvoice({
      tenantId: context.tenantId,
      createdBy: context.userId,
      data: req.body,
    });
    recordAuditFromRequest(req, {
      tenantId: context.tenantId,
      actorId: context.userId,
      action: 'fees.invoice.create',
      entityType: 'fee_invoice',
      entityId: invoice.id,
      summary: `Created invoice "${invoice.title}"`,
      metadata: { amount: invoice.amount, studentId: invoice.studentId },
    });
    return ApiResponse.created(res, invoice, 'Invoice created');
  }),

  generateInvoices: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const result = await feesService.generateInvoices({
      tenantId: context.tenantId,
      createdBy: context.userId,
      data: req.body,
    });
    recordAuditFromRequest(req, {
      tenantId: context.tenantId,
      actorId: context.userId,
      action: 'fees.invoice.generate',
      entityType: 'fee_invoice',
      summary: `Generated ${result.createdCount} invoices`,
      metadata: { structureId: req.body.feeStructureId, invoiceIds: result.invoiceIds },
    });
    return ApiResponse.created(res, result, 'Invoices generated');
  }),

  issueInvoice: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const invoice = await feesService.issueInvoice(getId(req), context.tenantId);
    recordAuditFromRequest(req, {
      tenantId: context.tenantId,
      actorId: context.userId,
      action: 'fees.invoice.issue',
      entityType: 'fee_invoice',
      entityId: invoice.id,
      summary: `Issued invoice "${invoice.title}"`,
    });
    return ApiResponse.success(res, invoice, 'Invoice issued');
  }),

  recordPayment: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const invoice = await feesService.recordPayment({
      tenantId: context.tenantId,
      recordedBy: context.userId,
      invoiceId: getId(req),
      data: req.body,
    });
    recordAuditFromRequest(req, {
      tenantId: context.tenantId,
      actorId: context.userId,
      action: 'fees.payment.record',
      entityType: 'fee_invoice',
      entityId: invoice.id,
      summary: `Recorded payment of ${req.body.amount} on invoice "${invoice.title}"`,
      metadata: { amount: req.body.amount, method: req.body.method },
    });
    return ApiResponse.created(res, invoice, 'Payment recorded');
  }),

  voidPayment: asyncHandler(async (req: Request, res: Response) => {
    const context = getSchoolContext(req);
    const paymentId = getId(req);
    const invoice = await feesService.voidPayment(paymentId, context.tenantId);
    recordAuditFromRequest(req, {
      tenantId: context.tenantId,
      actorId: context.userId,
      action: 'fees.payment.void',
      entityType: 'fee_payment',
      entityId: paymentId,
      summary: `Voided payment on invoice "${invoice.title}"`,
      metadata: { invoiceId: invoice.id },
    });
    return ApiResponse.success(res, invoice, 'Payment voided');
  }),
};
