import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { can } from '../../middleware/authorize.js';
import { enforceTenantScope } from '../../middleware/enforce-tenant-scope.js';
import { validate } from '../../middleware/validate.js';
import { diaryController } from './diary.controller.js';
import {
  createDiarySchema,
  diaryIdSchema,
  listDiarySchema,
  updateDiarySchema,
} from './diary.validator.js';

const router = Router();

router.use(authenticate, enforceTenantScope);

router.get('/', can('diary.read'), validate(listDiarySchema), diaryController.list);
router.post('/', can('diary.write'), validate(createDiarySchema), diaryController.create);
router.get('/:id', can('diary.read'), validate(diaryIdSchema), diaryController.getById);
router.patch('/:id', can('diary.write'), validate(updateDiarySchema), diaryController.update);
router.post(
  '/:id/publish',
  can('diary.write'),
  validate(diaryIdSchema),
  diaryController.publish,
);
router.delete('/:id', can('diary.write'), validate(diaryIdSchema), diaryController.delete);

export default router;
