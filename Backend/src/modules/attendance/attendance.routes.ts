import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { can } from '../../middleware/authorize.js';
import { enforceTenantScope } from '../../middleware/enforce-tenant-scope.js';
import { validate } from '../../middleware/validate.js';
import { attendanceController } from './attendance.controller.js';
import {
  getSheetSchema,
  saveSheetSchema,
  summarySchema,
} from './attendance.validator.js';

const router = Router();

router.use(authenticate, enforceTenantScope);

router.get(
  '/sheet',
  can('attendance.read'),
  validate(getSheetSchema),
  attendanceController.getSheet,
);
router.put(
  '/sheet',
  can('attendance.mark'),
  validate(saveSheetSchema),
  attendanceController.saveSheet,
);
router.get(
  '/summary',
  can('attendance.read'),
  validate(summarySchema),
  attendanceController.summary,
);

export default router;
