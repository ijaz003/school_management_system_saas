import { Router } from 'express';
import { authenticate } from '../../../middleware/authenticate.js';
import { requireSuperAdmin } from '../../../middleware/authorize.js';
import { validate } from '../../../middleware/validate.js';
import { tenantsController } from '../../tenants/tenants.controller.js';
import {
  createTenantSchema,
  listTenantsSchema,
  tenantIdSchema,
  updateTenantPermissionsSchema,
  updateTenantSchema,
} from '../../tenants/tenants.validator.js';

const router = Router();

router.use(authenticate, requireSuperAdmin());

router.get('/', validate(listTenantsSchema), tenantsController.list);
router.post('/', validate(createTenantSchema), tenantsController.create);
router.get('/:id', validate(tenantIdSchema), tenantsController.getById);
router.patch('/:id', validate(updateTenantSchema), tenantsController.update);
router.patch(
  '/:id/permissions',
  validate(updateTenantPermissionsSchema),
  tenantsController.updatePermissions,
);
router.post('/:id/suspend', validate(tenantIdSchema), tenantsController.suspend);
router.post('/:id/activate', validate(tenantIdSchema), tenantsController.activate);
router.delete('/:id', validate(tenantIdSchema), tenantsController.delete);

export default router;
