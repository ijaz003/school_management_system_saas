import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { errorHandler } from './middleware/error-handler.js';
import { notFound } from './middleware/not-found.js';
import { requestLogger } from './middleware/request-logger.js';
import { resolveTenant } from './middleware/resolve-tenant.js';
import authRoutes from './modules/auth/auth.routes.js';
import healthRoutes from './modules/health/health.routes.js';
import { ApiResponse } from './lib/response.js';
import superAdminSchoolsRoutes from './modules/super-admin/schools/schools.routes.js';
import customRolesRoutes from './modules/school/custom-roles/custom-roles.routes.js';
import assignRoleRoutes from './modules/school/staff/assign-role.routes.js';
import systemRolesRoutes from './modules/roles/roles.routes.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: [env.FRONTEND_URL],
      credentials: true,
    }),
  );

  app.use(compression());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  app.use(requestLogger);

  app.get('/health', (_req, res) => {
    return ApiResponse.success(
      res,
      {
        timestamp: new Date().toISOString(),
        environment: env.NODE_ENV,
        uptime: process.uptime(),
      },
      'Server is healthy',
    );
  });

  app.use('/api', resolveTenant);
  app.use('/api/auth', authRoutes);
  app.use('/api/health', healthRoutes);
  app.use('/api/super-admin/schools', superAdminSchoolsRoutes);
  app.use('/api/super-admin/roles', systemRolesRoutes);
  app.use('/api/school/roles', customRolesRoutes);
  app.use('/api/school/users', assignRoleRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
