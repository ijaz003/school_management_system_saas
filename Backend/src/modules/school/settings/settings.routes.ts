import { Router } from 'express';
import { authenticate } from '../../../middleware/authenticate.js';
import { can } from '../../../middleware/authorize.js';
import { enforceTenantScope } from '../../../middleware/enforce-tenant-scope.js';
import { validate } from '../../../middleware/validate.js';
import { settingsController } from './settings.controller.js';
import { updateSchoolSettingsSchema } from './settings.validator.js';

const router = Router();

router.use(authenticate, enforceTenantScope);

router.get('/', can('settings.school.edit'), settingsController.get);
router.patch('/', can('settings.school.edit'), validate(updateSchoolSettingsSchema), settingsController.update);

export default router;
