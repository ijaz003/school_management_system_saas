import { Router } from 'express';
import { authenticate } from '../../../middleware/authenticate.js';
import { can, requireRole } from '../../../middleware/authorize.js';
import { enforceTenantScope } from '../../../middleware/enforce-tenant-scope.js';
import { validate } from '../../../middleware/validate.js';
import { staffController } from './staff.controller.js';
import {
  createStaffSchema,
  listStaffSchema,
  staffIdSchema,
  updateStaffSchema,
} from './staff.validator.js';

const router = Router();

router.use(authenticate, enforceTenantScope, requireRole('school_admin', 'principal'));

router.get(
  '/',
  can('settings.users.manage'),
  validate(listStaffSchema),
  staffController.list,
);
router.get(
  '/roles/available',
  can('settings.users.manage'),
  staffController.availableRoles,
);
router.post(
  '/',
  can('settings.users.manage'),
  validate(createStaffSchema),
  staffController.create,
);
router.get(
  '/:id',
  can('settings.users.manage'),
  validate(staffIdSchema),
  staffController.getById,
);
router.patch(
  '/:id',
  can('settings.users.manage'),
  validate(updateStaffSchema),
  staffController.update,
);
router.delete(
  '/:id',
  can('settings.users.manage'),
  validate(staffIdSchema),
  staffController.delete,
);
router.post(
  '/:id/reset-password',
  can('settings.users.manage'),
  validate(staffIdSchema),
  staffController.resetPassword,
);

export default router;
