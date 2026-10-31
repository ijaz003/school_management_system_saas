import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { can } from '../../middleware/authorize.js';
import { enforceTenantScope } from '../../middleware/enforce-tenant-scope.js';
import { validate } from '../../middleware/validate.js';
import { teachersController } from './teachers.controller.js';
import {
  assignmentIdSchema,
  createAssignmentSchema,
  listAssignmentsSchema,
  listTeachersSchema,
  setClassTeacherSchema,
  teacherIdSchema,
} from './teachers.validator.js';

const router = Router();

router.use(authenticate, enforceTenantScope);

router.get('/', can('teachers.read'), validate(listTeachersSchema), teachersController.list);
router.get(
  '/assignments',
  can('teachers.read'),
  validate(listAssignmentsSchema),
  teachersController.listAssignments,
);
router.post(
  '/assignments',
  can('teachers.update'),
  validate(createAssignmentSchema),
  teachersController.createAssignment,
);
router.delete(
  '/assignments/:id',
  can('teachers.update'),
  validate(assignmentIdSchema),
  teachersController.deleteAssignment,
);
router.patch(
  '/sections/:sectionId/class-teacher',
  can('teachers.update'),
  validate(setClassTeacherSchema),
  teachersController.setClassTeacher,
);
router.get('/:id', can('teachers.read'), validate(teacherIdSchema), teachersController.getById);

export default router;
