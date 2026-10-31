import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { canAny } from '../../middleware/authorize.js';
import { enforceTenantScope } from '../../middleware/enforce-tenant-scope.js';
import { dashboardController } from './dashboard.controller.js';

const router = Router();

router.use(authenticate, enforceTenantScope);

router.get(
  '/stats',
  canAny(
    'students.read',
    'teachers.read',
    'attendance.read',
    'fees.invoice.read',
    'notices.read',
    'exams.marks.enter',
    'settings.school.edit',
  ),
  dashboardController.stats,
);

export default router;
