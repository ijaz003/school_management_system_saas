import { Router } from 'express';
import { authenticate } from '../../../middleware/authenticate.js';
import { can, requireRole } from '../../../middleware/authorize.js';
import { enforceTenantScope } from '../../../middleware/enforce-tenant-scope.js';
import { validate } from '../../../middleware/validate.js';
import { rolesController } from '../../roles/roles.controller.js';
import { assignRoleSchema } from '../../roles/roles.validator.js';

const router = Router();

router.use(authenticate, enforceTenantScope, requireRole('school_admin', 'principal'));

router.post(
  '/:userId/assign-role',
  can('settings.users.manage'),
  validate(assignRoleSchema),
  rolesController.assignRole,
);

export default router;
