import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { can } from '../../middleware/authorize.js';
import { enforceTenantScope } from '../../middleware/enforce-tenant-scope.js';
import { validate } from '../../middleware/validate.js';
import { noticesController } from './notices.controller.js';
import {
  createNoticeSchema,
  listNoticesSchema,
  noticeIdSchema,
  updateNoticeSchema,
} from './notices.validator.js';

const router = Router();

router.use(authenticate, enforceTenantScope);

router.get('/', can('notices.read'), validate(listNoticesSchema), noticesController.list);
router.post('/', can('notices.send'), validate(createNoticeSchema), noticesController.create);
router.get('/:id', can('notices.read'), validate(noticeIdSchema), noticesController.getById);
router.patch('/:id', can('notices.send'), validate(updateNoticeSchema), noticesController.update);
router.post('/:id/publish', can('notices.send'), validate(noticeIdSchema), noticesController.publish);
router.delete('/:id', can('notices.send'), validate(noticeIdSchema), noticesController.delete);

export default router;
