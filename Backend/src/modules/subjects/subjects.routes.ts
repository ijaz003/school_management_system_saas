import { Router } from 'express';
import { can } from '../../middleware/authorize.js';
import { authenticate } from '../../middleware/authenticate.js';
import { enforceTenantScope } from '../../middleware/enforce-tenant-scope.js';
import { validate } from '../../middleware/validate.js';
import { subjectsController } from './subjects.controller.js';
import {
  createSubjectSchema,
  listSubjectsSchema,
  subjectIdSchema,
  updateSubjectSchema,
} from './subjects.validator.js';

const router = Router();

router.use(authenticate, enforceTenantScope);
router.get('/', can('classes.read'), validate(listSubjectsSchema), subjectsController.list);
router.post('/', can('classes.create'), validate(createSubjectSchema), subjectsController.create);
router.get('/:id', can('classes.read'), validate(subjectIdSchema), subjectsController.getById);
router.patch('/:id', can('classes.update'), validate(updateSubjectSchema), subjectsController.update);
router.delete('/:id', can('classes.delete'), validate(subjectIdSchema), subjectsController.delete);

export default router;
