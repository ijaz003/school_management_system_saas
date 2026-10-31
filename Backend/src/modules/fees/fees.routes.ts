import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { can, canAny } from '../../middleware/authorize.js';
import { enforceTenantScope } from '../../middleware/enforce-tenant-scope.js';
import { validate } from '../../middleware/validate.js';
import { feesController } from './fees.controller.js';
import {
  createFeeStructureSchema,
  createInvoiceSchema,
  generateInvoicesSchema,
  invoiceIdSchema,
  listFeeStructuresSchema,
  listInvoicesSchema,
  paymentIdSchema,
  recordPaymentSchema,
  structureIdSchema,
  updateFeeStructureSchema,
} from './fees.validator.js';

const router = Router();

router.use(authenticate, enforceTenantScope);

router.get(
  '/structures',
  canAny('fees.structure.edit', 'fees.invoice.read', 'fees.invoice.create'),
  validate(listFeeStructuresSchema),
  feesController.listStructures,
);
router.post(
  '/structures',
  can('fees.structure.edit'),
  validate(createFeeStructureSchema),
  feesController.createStructure,
);
router.patch(
  '/structures/:id',
  can('fees.structure.edit'),
  validate(updateFeeStructureSchema),
  feesController.updateStructure,
);
router.delete(
  '/structures/:id',
  can('fees.structure.edit'),
  validate(structureIdSchema),
  feesController.deleteStructure,
);

router.get(
  '/invoices',
  can('fees.invoice.read'),
  validate(listInvoicesSchema),
  feesController.listInvoices,
);
router.post(
  '/invoices/generate',
  can('fees.invoice.create'),
  validate(generateInvoicesSchema),
  feesController.generateInvoices,
);
router.post(
  '/invoices',
  can('fees.invoice.create'),
  validate(createInvoiceSchema),
  feesController.createInvoice,
);
router.get(
  '/invoices/:id',
  can('fees.invoice.read'),
  validate(invoiceIdSchema),
  feesController.getInvoice,
);
router.post(
  '/invoices/:id/issue',
  can('fees.invoice.create'),
  validate(invoiceIdSchema),
  feesController.issueInvoice,
);
router.post(
  '/invoices/:id/payments',
  can('fees.payment.record'),
  validate(recordPaymentSchema),
  feesController.recordPayment,
);
router.delete(
  '/payments/:id',
  can('fees.payment.refund'),
  validate(paymentIdSchema),
  feesController.voidPayment,
);

export default router;
