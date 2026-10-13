import { Router } from 'express';
import { authenticate } from '../../../middleware/authenticate.js';
import { requireRoleOrPermission } from '../../../middleware/authorize.js';
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

router.use(
  authenticate,
  enforceTenantScope,
  requireRoleOrPermission(
    ['school_admin', 'principal'],
    ['settings.users.manage'],
  ),
);

router.get(
  '/',
  validate(listStaffSchema),
  staffController.list,
);
router.get(
  '/roles/available',
  staffController.availableRoles,
);
router.post(
  '/',
  validate(createStaffSchema),
  staffController.create,
);
router.get(
  '/:id',
  validate(staffIdSchema),
  staffController.getById,
);
router.patch(
  '/:id',
  validate(updateStaffSchema),
  staffController.update,
);
router.delete(
  '/:id',
  validate(staffIdSchema),
  staffController.delete,
);
router.post(
  '/:id/reset-password',
  validate(staffIdSchema),
  staffController.resetPassword,
);

export default router;
