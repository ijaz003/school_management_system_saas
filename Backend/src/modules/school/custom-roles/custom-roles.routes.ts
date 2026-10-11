import { Router } from 'express';
import { authenticate } from '../../../middleware/authenticate.js';
import { can, requireRole } from '../../../middleware/authorize.js';
import { enforceTenantScope } from '../../../middleware/enforce-tenant-scope.js';
import { validate } from '../../../middleware/validate.js';
import { rolesController } from '../../roles/roles.controller.js';
import {
  createRoleSchema,
  roleIdSchema,
  updateRoleSchema,
} from '../../roles/roles.validator.js';

const router = Router();

router.use(authenticate, enforceTenantScope, requireRole('school_admin', 'principal'));

router.get(
  '/',
  can('settings.roles.manage'),
  rolesController.listTenantRoles,
);
router.get(
  '/available-permissions',
  can('settings.roles.manage'),
  rolesController.getAvailablePermissions,
);
router.post(
  '/',
  can('settings.roles.manage'),
  validate(createRoleSchema),
  rolesController.create,
);
router.get(
  '/:id',
  can('settings.roles.manage'),
  validate(roleIdSchema),
  rolesController.getById,
);
router.patch(
  '/:id',
  can('settings.roles.manage'),
  validate(updateRoleSchema),
  rolesController.update,
);
router.delete(
  '/:id',
  can('settings.roles.manage'),
  validate(roleIdSchema),
  rolesController.delete,
);

export default router;
