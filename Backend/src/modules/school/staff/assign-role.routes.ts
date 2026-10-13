import { Router } from 'express';
import { authenticate } from '../../../middleware/authenticate.js';
import { requireRoleOrPermission } from '../../../middleware/authorize.js';
import { enforceTenantScope } from '../../../middleware/enforce-tenant-scope.js';
import { validate } from '../../../middleware/validate.js';
import { rolesController } from '../../roles/roles.controller.js';
import { assignRoleSchema } from '../../roles/roles.validator.js';

const router = Router();

router.use(
  authenticate,
  enforceTenantScope,
  requireRoleOrPermission(
    ['school_admin', 'principal'],
    ['settings.users.manage'],
  ),
);

router.post(
  '/:userId/assign-role',
  validate(assignRoleSchema),
  rolesController.assignRole,
);

export default router;
