import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { canAny } from '../../middleware/authorize.js';
import { enforceTenantScope } from '../../middleware/enforce-tenant-scope.js';
import { validate } from '../../middleware/validate.js';
import { auditController } from './audit.controller.js';
import { listAuditLogsSchema } from './audit.validator.js';

const router = Router();

router.use(authenticate, enforceTenantScope);

router.get(
  '/',
  canAny('audit.read', 'settings.users.manage', 'settings.school.edit'),
  validate(listAuditLogsSchema),
  auditController.list,
);

export default router;
