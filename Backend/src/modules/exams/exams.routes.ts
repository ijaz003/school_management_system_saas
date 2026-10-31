import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { can, canAny } from '../../middleware/authorize.js';
import { enforceTenantScope } from '../../middleware/enforce-tenant-scope.js';
import { validate } from '../../middleware/validate.js';
import { examsController } from './exams.controller.js';
import {
  createExamSchema,
  examIdSchema,
  listExamsSchema,
  marksSheetSchema,
  saveMarksSchema,
  setExamSubjectsSchema,
  updateExamSchema,
} from './exams.validator.js';

const router = Router();

router.use(authenticate, enforceTenantScope);

const canReadExams = canAny(
  'exams.marks.enter',
  'exams.schedule.create',
  'exams.result.publish',
  'exams.reportcard.generate',
  'exams.marks.approve',
);

router.get('/', canReadExams, validate(listExamsSchema), examsController.list);
router.post('/', can('exams.schedule.create'), validate(createExamSchema), examsController.create);
router.get('/:id', canReadExams, validate(examIdSchema), examsController.getById);
router.patch('/:id', can('exams.schedule.create'), validate(updateExamSchema), examsController.update);
router.delete('/:id', can('exams.schedule.create'), validate(examIdSchema), examsController.delete);
router.put(
  '/:id/subjects',
  can('exams.schedule.create'),
  validate(setExamSubjectsSchema),
  examsController.setSubjects,
);
router.post(
  '/:id/open-marks',
  canAny('exams.schedule.create', 'exams.marks.enter'),
  validate(examIdSchema),
  examsController.openMarks,
);
router.post(
  '/:id/publish',
  can('exams.result.publish'),
  validate(examIdSchema),
  examsController.publish,
);
router.get(
  '/:id/marks-sheet',
  canAny('exams.marks.enter', 'exams.marks.approve', 'exams.result.publish'),
  validate(marksSheetSchema),
  examsController.marksSheet,
);
router.put(
  '/:id/marks',
  can('exams.marks.enter'),
  validate(saveMarksSchema),
  examsController.saveMarks,
);
router.get(
  '/:id/results',
  canAny('exams.result.publish', 'exams.reportcard.generate', 'exams.marks.enter'),
  validate(examIdSchema),
  examsController.results,
);

export default router;
