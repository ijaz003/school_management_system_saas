import { Router } from 'express';
import { can } from '../../middleware/authorize.js';
import { authenticate } from '../../middleware/authenticate.js';
import { enforceTenantScope } from '../../middleware/enforce-tenant-scope.js';
import { validate } from '../../middleware/validate.js';
import { sectionsController } from './sections.controller.js';
import {
  createSectionSchema,
  listSectionsSchema,
  sectionIdSchema,
  setSectionSubjectsSchema,
  updateSectionSchema,
} from './sections.validator.js';

const router = Router();

router.use(authenticate, enforceTenantScope);
router.get(
  '/classes/:classId/sections',
  can('classes.read'),
  validate(listSectionsSchema),
  sectionsController.listByClass,
);
router.post('/sections', can('classes.create'), validate(createSectionSchema), sectionsController.create);
router.get('/sections/:id', can('classes.read'), validate(sectionIdSchema), sectionsController.getById);
router.patch('/sections/:id', can('classes.update'), validate(updateSectionSchema), sectionsController.update);
router.delete('/sections/:id', can('classes.delete'), validate(sectionIdSchema), sectionsController.delete);
router.get('/sections/:id/subjects', can('classes.read'), validate(sectionIdSchema), sectionsController.getSubjects);
router.post('/sections/:id/subjects', can('classes.update'), validate(setSectionSubjectsSchema), sectionsController.setSubjects);

export default router;
