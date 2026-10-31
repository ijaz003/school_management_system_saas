import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { canAny } from '../../middleware/authorize.js';
import { enforceTenantScope } from '../../middleware/enforce-tenant-scope.js';
import { validate } from '../../middleware/validate.js';
import { reportsController } from './reports.controller.js';
import {
  academicReportSchema,
  attendanceReportSchema,
  feesReportSchema,
} from './reports.validator.js';

const router = Router();

router.use(authenticate, enforceTenantScope);

router.get(
  '/fees',
  canAny('reports.fees', 'fees.invoice.read'),
  validate(feesReportSchema),
  reportsController.fees,
);

router.get(
  '/attendance',
  canAny('reports.attendance', 'attendance.read', 'attendance.report'),
  validate(attendanceReportSchema),
  reportsController.attendance,
);

router.get(
  '/academic',
  canAny('reports.academic', 'exams.result.publish', 'exams.reportcard.generate'),
  validate(academicReportSchema),
  reportsController.academic,
);

export default router;
