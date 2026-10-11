import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { requireSuperAdmin } from '../../middleware/authorize.js';
import { rolesController } from './roles.controller.js';

const router = Router();

router.use(authenticate, requireSuperAdmin());
router.get('/', rolesController.listSystemRoles);
router.get('/permissions', rolesController.listPermissions);

export default router;
