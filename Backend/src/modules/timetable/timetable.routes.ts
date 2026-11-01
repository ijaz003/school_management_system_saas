import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { can, canAny } from '../../middleware/authorize.js';
import { enforceTenantScope } from '../../middleware/enforce-tenant-scope.js';
import { validate } from '../../middleware/validate.js';
import { timetableController } from './timetable.controller.js';
import {
  createTimetablePeriodSchema,
  listTimetableSchema,
  timetableEntryIdSchema,
  timetablePeriodIdSchema,
  updateTimetableEntrySchema,
  updateTimetablePeriodSchema,
  upsertTimetableEntrySchema,
} from './timetable.validator.js';

const router = Router();

router.use(authenticate, enforceTenantScope);

router.get(
  '/periods',
  canAny('timetable.read', 'timetable.write'),
  timetableController.listPeriods,
);
router.post(
  '/periods',
  can('timetable.write'),
  validate(createTimetablePeriodSchema),
  timetableController.createPeriod,
);
router.patch(
  '/periods/:id',
  can('timetable.write'),
  validate(updateTimetablePeriodSchema),
  timetableController.updatePeriod,
);
router.delete(
  '/periods/:id',
  can('timetable.write'),
  validate(timetablePeriodIdSchema),
  timetableController.deletePeriod,
);

router.get(
  '/',
  can('timetable.read'),
  validate(listTimetableSchema),
  timetableController.getSectionTimetable,
);
router.put(
  '/entries',
  can('timetable.write'),
  validate(upsertTimetableEntrySchema),
  timetableController.upsertEntry,
);
router.patch(
  '/entries/:id',
  can('timetable.write'),
  validate(updateTimetableEntrySchema),
  timetableController.updateEntry,
);
router.delete(
  '/entries/:id',
  can('timetable.write'),
  validate(timetableEntryIdSchema),
  timetableController.deleteEntry,
);

export default router;
