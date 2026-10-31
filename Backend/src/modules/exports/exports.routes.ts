import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { can, canAny } from '../../middleware/authorize.js';
import { enforceTenantScope } from '../../middleware/enforce-tenant-scope.js';
import { validate } from '../../middleware/validate.js';
import { exportsController } from './exports.controller.js';
import {
  exportExamMarksSchema,
  exportInvoicesSchema,
  exportStudentsSchema,
} from './exports.validator.js';

const router = Router();

router.use(authenticate, enforceTenantScope);

router.get(
  '/students',
  can('students.read'),
  validate(exportStudentsSchema),
  exportsController.students,
);

router.get(
  '/invoices',
  can('fees.invoice.read'),
  validate(exportInvoicesSchema),
  exportsController.invoices,
);

router.get(
  '/exams/:examId/marks',
  canAny(
    'exams.marks.enter',
    'exams.result.publish',
    'exams.reportcard.generate',
    'exams.marks.approve',
  ),
  validate(exportExamMarksSchema),
  exportsController.examMarks,
);

export default router;
