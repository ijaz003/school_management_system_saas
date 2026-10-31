import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { can } from '../../middleware/authorize.js';
import { enforceTenantScope } from '../../middleware/enforce-tenant-scope.js';
import { validate } from '../../middleware/validate.js';
import { studentsController } from './students.controller.js';
import {
  createStudentSchema,
  listStudentsSchema,
  studentIdSchema,
  updateStudentSchema,
} from './students.validator.js';

const router = Router();

router.use(authenticate, enforceTenantScope);

router.get('/', can('students.read'), validate(listStudentsSchema), studentsController.list);
router.post('/', can('students.create'), validate(createStudentSchema), studentsController.create);
router.get('/:id', can('students.read'), validate(studentIdSchema), studentsController.getById);
router.patch('/:id', can('students.update'), validate(updateStudentSchema), studentsController.update);
router.delete('/:id', can('students.delete'), validate(studentIdSchema), studentsController.delete);

export default router;
