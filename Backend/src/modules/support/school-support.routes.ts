import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { can } from '../../middleware/authorize.js';
import { enforceTenantScope } from '../../middleware/enforce-tenant-scope.js';
import { validate } from '../../middleware/validate.js';
import { schoolSupportController } from './support.controller.js';
import {
  createSupportMessageSchema,
  createSupportTicketSchema,
  listSupportTicketsSchema,
  supportTicketIdSchema,
  updateSupportTicketSchema,
} from './support.validator.js';

const router = Router();

router.use(authenticate, enforceTenantScope);

router.get('/', can('support.read'), validate(listSupportTicketsSchema), schoolSupportController.list);
router.post('/', can('support.create'), validate(createSupportTicketSchema), schoolSupportController.create);
router.get('/:id', can('support.read'), validate(supportTicketIdSchema), schoolSupportController.getById);
router.patch(
  '/:id',
  can('support.create'),
  validate(updateSupportTicketSchema),
  schoolSupportController.update,
);
router.post(
  '/:id/messages',
  can('support.create'),
  validate(createSupportMessageSchema),
  schoolSupportController.addMessage,
);

export default router;
