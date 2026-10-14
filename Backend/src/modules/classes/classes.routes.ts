import { Router } from 'express';
import { can } from '../../middleware/authorize.js';
import { authenticate } from '../../middleware/authenticate.js';
import { enforceTenantScope } from '../../middleware/enforce-tenant-scope.js';
import { validate } from '../../middleware/validate.js';
import { classesController } from './classes.controller.js';
import {
  addSubjectsToClassSchema,
  classIdSchema,
  classSubjectParamsSchema,
  createClassSchema,
  listClassesSchema,
  updateClassSchema,
} from './classes.validator.js';

const router = Router();

router.use(authenticate, enforceTenantScope);
router.get('/', can('classes.read'), validate(listClassesSchema), classesController.list);
router.post('/', can('classes.create'), validate(createClassSchema), classesController.create);
router.get('/:id', can('classes.read'), validate(classIdSchema), classesController.getById);
router.patch('/:id', can('classes.update'), validate(updateClassSchema), classesController.update);
router.delete('/:id', can('classes.delete'), validate(classIdSchema), classesController.delete);
router.post('/:id/subjects', can('classes.update'), validate(addSubjectsToClassSchema), classesController.addSubjects);
router.delete('/:id/subjects/:subjectId', can('classes.update'), validate(classSubjectParamsSchema), classesController.removeSubject);

export default router;
