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
import staffRoutes from './modules/school/staff/staff.routes.js';
import systemRolesRoutes from './modules/roles/roles.routes.js';
import classesRoutes from './modules/classes/classes.routes.js';
import subjectsRoutes from './modules/subjects/subjects.routes.js';
import sectionsRoutes from './modules/sections/sections.routes.js';
import studentsRoutes from './modules/students/students.routes.js';
import teachersRoutes from './modules/teachers/teachers.routes.js';
import attendanceRoutes from './modules/attendance/attendance.routes.js';
import noticesRoutes from './modules/notices/notices.routes.js';
import feesRoutes from './modules/fees/fees.routes.js';
import examsRoutes from './modules/exams/exams.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';
import reportsRoutes from './modules/reports/reports.routes.js';
import auditRoutes from './modules/audit/audit.routes.js';
import exportsRoutes from './modules/exports/exports.routes.js';
import settingsRoutes from './modules/school/settings/settings.routes.js';

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
  app.use('/api/school/staff', staffRoutes);
  app.use('/api/school/subjects', subjectsRoutes);
  app.use('/api/school/classes', classesRoutes);
  app.use('/api/school/students', studentsRoutes);
  app.use('/api/school/teachers', teachersRoutes);
  app.use('/api/school/attendance', attendanceRoutes);
  app.use('/api/school/notices', noticesRoutes);
  app.use('/api/school/fees', feesRoutes);
  app.use('/api/school/exams', examsRoutes);
  app.use('/api/school/dashboard', dashboardRoutes);
  app.use('/api/school/reports', reportsRoutes);
  app.use('/api/school/audit-logs', auditRoutes);
  app.use('/api/school/exports', exportsRoutes);
  app.use('/api/school/settings', settingsRoutes);
  app.use('/api/school', sectionsRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
