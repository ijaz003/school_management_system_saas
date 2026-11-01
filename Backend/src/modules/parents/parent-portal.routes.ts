import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { requireRole } from '../../middleware/authorize.js';
import { enforceTenantScope } from '../../middleware/enforce-tenant-scope.js';
import { parentPortalController } from './parents.controller.js';

const router = Router();

router.use(authenticate, enforceTenantScope, requireRole('parent'));

router.get('/', parentPortalController.home);
router.get('/notices', parentPortalController.notices);
router.get('/children/:studentId/attendance', parentPortalController.attendance);
router.get('/children/:studentId/fees', parentPortalController.fees);
router.get('/children/:studentId/diary', parentPortalController.diary);
router.get('/children/:studentId/results', parentPortalController.results);

export default router;
