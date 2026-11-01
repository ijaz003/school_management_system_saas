import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { can } from '../../middleware/authorize.js';
import { enforceTenantScope } from '../../middleware/enforce-tenant-scope.js';
import { validate } from '../../middleware/validate.js';
import { parentsController } from './parents.controller.js';
import {
  createParentSchema,
  linkStudentsSchema,
  listParentsSchema,
  parentIdSchema,
  unlinkStudentSchema,
  updateParentSchema,
} from './parents.validator.js';

const router = Router();

router.use(authenticate, enforceTenantScope);

router.get('/', can('settings.users.manage'), validate(listParentsSchema), parentsController.list);
router.post('/', can('settings.users.manage'), validate(createParentSchema), parentsController.create);
router.get('/:id', can('settings.users.manage'), validate(parentIdSchema), parentsController.getById);
router.patch(
  '/:id',
  can('settings.users.manage'),
  validate(updateParentSchema),
  parentsController.update,
);
router.post(
  '/:id/students',
  can('settings.users.manage'),
  validate(linkStudentsSchema),
  parentsController.linkStudents,
);
router.delete(
  '/:id/students/:studentId',
  can('settings.users.manage'),
  validate(unlinkStudentSchema),
  parentsController.unlinkStudent,
);
router.post(
  '/:id/reset-password',
  can('settings.users.manage'),
  validate(parentIdSchema),
  parentsController.resetPassword,
);

export default router;
