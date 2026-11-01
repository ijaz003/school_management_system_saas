import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { requireSuperAdmin } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { platformSupportController } from './support.controller.js';
import {
  createSupportMessageSchema,
  listSupportTicketsSchema,
  supportTicketIdSchema,
  updateSupportTicketSchema,
} from './support.validator.js';

const router = Router();

router.use(authenticate, requireSuperAdmin());

router.get('/', validate(listSupportTicketsSchema), platformSupportController.list);
router.get('/:id', validate(supportTicketIdSchema), platformSupportController.getById);
router.patch('/:id', validate(updateSupportTicketSchema), platformSupportController.update);
router.post(
  '/:id/messages',
  validate(createSupportMessageSchema),
  platformSupportController.addMessage,
);

export default router;
