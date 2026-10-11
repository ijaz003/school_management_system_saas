import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import { authController } from './auth.controller.js';
import {
  loginSchema,
  logoutSchema,
  refreshSchema,
} from './auth.validator.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  handler: (_req, res) => {
    return res.status(429).json({
      status: 429,
      message: 'Too many login attempts. Please try again later.',
      data: null,
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  handler: (_req, res) => {
    return res.status(429).json({
      status: 429,
      message: 'Too many refresh attempts.',
      data: null,
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login', loginLimiter, validate(loginSchema), authController.login);
router.post(
  '/refresh',
  refreshLimiter,
  validate(refreshSchema),
  authController.refresh,
);
router.post('/logout', validate(logoutSchema), authController.logout);
router.get('/me', authenticate, authController.me);

export default router;
