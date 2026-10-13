import { Router } from 'express';
import { authenticate } from '../../../middleware/authenticate.js';
import { requireRoleOrPermission } from '../../../middleware/authorize.js';
import { enforceTenantScope } from '../../../middleware/enforce-tenant-scope.js';
import { validate } from '../../../middleware/validate.js';
import { rolesController } from '../../roles/roles.controller.js';
import {
  createRoleSchema,
  roleIdSchema,
  updateRoleSchema,
} from '../../roles/roles.validator.js';

const router = Router();

router.use(
  authenticate,
  enforceTenantScope,
  requireRoleOrPermission(
    ['school_admin'],
    ['settings.roles.manage'],
  ),
);

router.get(
  '/',
  rolesController.listTenantRoles,
);
router.get(
  '/available-permissions',
  rolesController.getAvailablePermissions,
);
router.post(
  '/',
  validate(createRoleSchema),
  rolesController.create,
);
router.get(
  '/:id',
  validate(roleIdSchema),
  rolesController.getById,
);
router.patch(
  '/:id',
  validate(updateRoleSchema),
  rolesController.update,
);
router.delete(
  '/:id',
  validate(roleIdSchema),
  rolesController.delete,
);

export default router;
