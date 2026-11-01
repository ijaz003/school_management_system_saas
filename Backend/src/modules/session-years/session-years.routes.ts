import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { can, canAny } from '../../middleware/authorize.js';
import { enforceTenantScope } from '../../middleware/enforce-tenant-scope.js';
import { validate } from '../../middleware/validate.js';
import { sessionYearsController } from './session-years.controller.js';
import {
  createSessionYearSchema,
  listPlacementsSchema,
  promoteStudentsSchema,
  sessionYearIdSchema,
  updateSessionYearSchema,
} from './session-years.validator.js';

const router = Router();

router.use(authenticate, enforceTenantScope);

const canReadSessions = canAny('session_years.read', 'settings.school.edit', 'students.read');
const canWriteSessions = canAny('session_years.write', 'settings.school.edit');
const canPromote = canAny('students.promote', 'students.update');

router.get('/', canReadSessions, sessionYearsController.list);
router.get('/current', canReadSessions, sessionYearsController.current);
router.get('/placements', canReadSessions, validate(listPlacementsSchema), sessionYearsController.listPlacements);
router.get('/promotions/preview', canPromote, sessionYearsController.promotionPreview);
router.post('/promotions', canPromote, validate(promoteStudentsSchema), sessionYearsController.promote);

router.post('/', canWriteSessions, validate(createSessionYearSchema), sessionYearsController.create);
router.get('/:id', canReadSessions, validate(sessionYearIdSchema), sessionYearsController.getById);
router.patch('/:id', canWriteSessions, validate(updateSessionYearSchema), sessionYearsController.update);
router.post(
  '/:id/set-current',
  canWriteSessions,
  validate(sessionYearIdSchema),
  sessionYearsController.setCurrent,
);
router.delete('/:id', canWriteSessions, validate(sessionYearIdSchema), sessionYearsController.delete);

export default router;
