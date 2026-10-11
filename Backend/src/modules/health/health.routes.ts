import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import {
  can,
  requireSuperAdmin,
} from '../../middleware/authorize.js';
import { enforceTenantScope } from '../../middleware/enforce-tenant-scope.js';
import { ApiResponse } from '../../lib/response.js';

const router = Router();

router.get('/protected', authenticate, enforceTenantScope, (req, res) =>
  ApiResponse.success(
    res,
    {
      message: 'You are authenticated!',
      user: req.user,
    },
    'Protected route accessed',
  ),
);

router.get('/admin-only', authenticate, requireSuperAdmin(), (_req, res) =>
  ApiResponse.success(
    res,
    { message: 'Welcome super admin!' },
    'Admin access granted',
  ),
);

router.get(
  '/with-permission',
  authenticate,
  enforceTenantScope,
  can('students.read'),
  (_req, res) =>
    ApiResponse.success(
      res,
      { message: 'You have students.read permission!' },
      'Permission granted',
    ),
);

export default router;
