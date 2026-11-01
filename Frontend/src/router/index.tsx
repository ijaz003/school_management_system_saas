import type { ReactNode } from 'react';
import { createBrowserRouter, Navigate, Outlet, RouterProvider } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { SchoolDashboard } from '@/features/school/dashboard/SchoolDashboard';
import { SuperAdminDashboard } from '@/features/super-admin/dashboard/SuperAdminDashboard';
import { SchoolsListPage } from '@/features/super-admin/schools/pages/SchoolsListPage';
import { SchoolCreatePage } from '@/features/super-admin/schools/pages/SchoolCreatePage';
import { SchoolDetailPage } from '@/features/super-admin/schools/pages/SchoolDetailPage';
import { RolesListPage } from '@/features/school/custom-roles/pages/RolesListPage';
import { StaffCreatePage } from '@/features/school/staff/pages/StaffCreatePage';
import { StaffDetailPage } from '@/features/school/staff/pages/StaffDetailPage';
import { StaffEditPage } from '@/features/school/staff/pages/StaffEditPage';
import { StaffListPage } from '@/features/school/staff/pages/StaffListPage';
import { ClassesListPage } from '@/features/school/classes/pages/ClassesListPage';
import { ClassDetailPage } from '@/features/school/classes/pages/ClassDetailPage';
import { SubjectsListPage } from '@/features/school/subjects/pages/SubjectsListPage';
import { StudentsListPage } from '@/features/school/students/pages/StudentsListPage';
import { StudentCreatePage } from '@/features/school/students/pages/StudentCreatePage';
import { StudentDetailPage } from '@/features/school/students/pages/StudentDetailPage';
import { StudentEditPage } from '@/features/school/students/pages/StudentEditPage';
import { TeachersListPage } from '@/features/school/teachers/pages/TeachersListPage';
import { TeacherDetailPage } from '@/features/school/teachers/pages/TeacherDetailPage';
import { AttendancePage } from '@/features/school/attendance/pages/AttendancePage';
import { AttendanceScanPage } from '@/features/school/attendance/pages/AttendanceScanPage';
import { StudentIdCardsPage } from '@/features/school/students/pages/StudentIdCardsPage';
import { NoticesListPage } from '@/features/school/notices/pages/NoticesListPage';
import { DiaryListPage } from '@/features/school/diary/pages/DiaryListPage';
import { FeesPage } from '@/features/school/fees/pages/FeesPage';
import { FeeVoucherPage } from '@/features/school/fees/pages/FeeVoucherPage';
import { ExpensesPage } from '@/features/school/expenses/pages/ExpensesPage';
import { ExamsListPage } from '@/features/school/exams/pages/ExamsListPage';
import { ExamDetailPage } from '@/features/school/exams/pages/ExamDetailPage';
import { ExamReportCardsPage } from '@/features/school/exams/pages/ExamReportCardsPage';
import { ReportsPage } from '@/features/school/reports/pages/ReportsPage';
import { AuditLogPage } from '@/features/school/audit/pages/AuditLogPage';
import { SchoolSettingsPage } from '@/features/school/settings/pages/SchoolSettingsPage';
import { SessionYearsPage } from '@/features/school/session-years/pages/SessionYearsPage';
import { PromoteStudentsPage } from '@/features/school/session-years/pages/PromoteStudentsPage';
import { SupportTicketsPage } from '@/features/school/support/pages/SupportTicketsPage';
import { SupportTicketDetailPage } from '@/features/school/support/pages/SupportTicketDetailPage';
import { ProfilePage } from '@/features/auth/pages/ProfilePage';
import { usePermission } from '@/hooks/usePermission';
import { useAppSelector } from '@/store/hooks';
import { selectUser } from '@/store/selectors/permissions';
import { Forbidden } from '@/pages/Forbidden';
import { NotFound } from '@/pages/NotFound';
import { GuestRoute } from './GuestRoute';
import { ProtectedRoute } from './ProtectedRoute';

function DashboardRouter() {
  const user = useAppSelector(selectUser);
  if (!user) return <Navigate to="/login" replace />;
  return user.role === 'super_admin' ? <SuperAdminDashboard /> : <SchoolDashboard />;
}

function PlaceholderPage({ title }: { title: string }) {
  return (
    <AppLayout>
      <section className="panel p-8">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-950">{title}</h1>
        <p className="mt-2 text-sm text-ink-500">This section is not available yet.</p>
      </section>
    </AppLayout>
  );
}

function SectionRoute({
  title,
  permission,
  superAdminOnly = false,
}: {
  title: string;
  permission?: string;
  superAdminOnly?: boolean;
}) {
  const user = useAppSelector(selectUser);
  const { can } = usePermission();

  if (superAdminOnly && user?.role !== 'super_admin') {
    return <Navigate to="/forbidden" replace />;
  }
  if (permission && user?.role !== 'super_admin' && !can(permission)) {
    return <Navigate to="/forbidden" replace />;
  }
  return <PlaceholderPage title={title} />;
}

function SuperAdminRoute() {
  const user = useAppSelector(selectUser);
  return user?.role === 'super_admin' ? <Outlet /> : <Navigate to="/forbidden" replace />;
}

function StaffRoute() {
  const user = useAppSelector(selectUser);
  const { can } = usePermission();
  if (user?.role === 'super_admin' || !can('settings.users.manage')) {
    return <Navigate to="/forbidden" replace />;
  }
  return <Outlet />;
}

function CustomRolesRoute() {
  const user = useAppSelector(selectUser);
  const { can } = usePermission();
  if (user?.role === 'super_admin' || !can('settings.roles.manage')) {
    return <Navigate to="/forbidden" replace />;
  }
  return <RolesListPage />;
}

function AcademicRoute() {
  const user = useAppSelector(selectUser);
  const { can } = usePermission();
  if (user?.role === 'super_admin' || !can('classes.read')) {
    return <Navigate to="/forbidden" replace />;
  }
  return <Outlet />;
}

function StudentsRoute({ permission }: { permission?: string }) {
  const user = useAppSelector(selectUser);
  const { can } = usePermission();
  if (user?.role === 'super_admin') {
    return <Navigate to="/forbidden" replace />;
  }
  if (permission && !can(permission)) {
    return <Navigate to="/forbidden" replace />;
  }
  return <Outlet />;
}

function RequireStudentPermission({
  permission,
  children,
}: {
  permission: string;
  children: ReactNode;
}) {
  const { can } = usePermission();
  if (!can(permission)) return <Navigate to="/forbidden" replace />;
  return children;
}

function TeachersRoute() {
  const user = useAppSelector(selectUser);
  const { can } = usePermission();
  if (user?.role === 'super_admin' || !can('teachers.read')) {
    return <Navigate to="/forbidden" replace />;
  }
  return <Outlet />;
}

function AttendanceRoute() {
  const user = useAppSelector(selectUser);
  const { can } = usePermission();
  if (user?.role === 'super_admin' || !can('attendance.read')) {
    return <Navigate to="/forbidden" replace />;
  }
  return <Outlet />;
}

function AttendanceScanRoute() {
  const user = useAppSelector(selectUser);
  const { can } = usePermission();
  if (user?.role === 'super_admin' || !can('attendance.mark')) {
    return <Navigate to="/forbidden" replace />;
  }
  return <AttendanceScanPage />;
}

function NoticesRoute() {
  const user = useAppSelector(selectUser);
  const { can } = usePermission();
  if (user?.role === 'super_admin' || !can('notices.read')) {
    return <Navigate to="/forbidden" replace />;
  }
  return <NoticesListPage />;
}

function SchoolSettingsRoute() {
  const user = useAppSelector(selectUser);
  const { can } = usePermission();
  if (user?.role === 'super_admin' || !can('settings.school.edit')) {
    return <Navigate to="/forbidden" replace />;
  }
  return <SchoolSettingsPage />;
}

function FeesRoute() {
  const user = useAppSelector(selectUser);
  const { can } = usePermission();
  if (user?.role === 'super_admin' || !can('fees.invoice.read')) {
    return <Navigate to="/forbidden" replace />;
  }
  return <Outlet />;
}

function ExpensesRoute() {
  const user = useAppSelector(selectUser);
  const { can } = usePermission();
  if (user?.role === 'super_admin' || !can('expenses.read')) {
    return <Navigate to="/forbidden" replace />;
  }
  return <ExpensesPage />;
}

function DiaryRoute() {
  const user = useAppSelector(selectUser);
  const { can } = usePermission();
  if (user?.role === 'super_admin' || !can('diary.read')) {
    return <Navigate to="/forbidden" replace />;
  }
  return <DiaryListPage />;
}

function SessionYearsRoute() {
  const user = useAppSelector(selectUser);
  const { can } = usePermission();
  const allowed =
    can('session_years.read') ||
    can('session_years.write') ||
    can('settings.school.edit');
  if (user?.role === 'super_admin' || !allowed) {
    return <Navigate to="/forbidden" replace />;
  }
  return <SessionYearsPage />;
}

function SupportRoute() {
  const user = useAppSelector(selectUser);
  const { can } = usePermission();
  if (user?.role === 'super_admin') {
    return <Outlet />;
  }
  if (!can('support.read')) {
    return <Navigate to="/forbidden" replace />;
  }
  return <Outlet />;
}

function SupportListRoute() {
  const user = useAppSelector(selectUser);
  return (
    <SupportTicketsPage scope={user?.role === 'super_admin' ? 'platform' : 'school'} />
  );
}

function SupportDetailRoute() {
  const user = useAppSelector(selectUser);
  return (
    <SupportTicketDetailPage scope={user?.role === 'super_admin' ? 'platform' : 'school'} />
  );
}

function PromoteStudentsRoute() {
  const user = useAppSelector(selectUser);
  const { can } = usePermission();
  const allowed = can('students.promote') || can('students.update');
  if (user?.role === 'super_admin' || !allowed) {
    return <Navigate to="/forbidden" replace />;
  }
  return <PromoteStudentsPage />;
}

function ExamsRoute() {
  const user = useAppSelector(selectUser);
  const { can } = usePermission();
  const allowed =
    can('exams.marks.enter') ||
    can('exams.schedule.create') ||
    can('exams.result.publish') ||
    can('exams.reportcard.generate');
  if (user?.role === 'super_admin' || !allowed) {
    return <Navigate to="/forbidden" replace />;
  }
  return <Outlet />;
}

function ReportsRoute() {
  const user = useAppSelector(selectUser);
  const { can } = usePermission();
  const allowed =
    can('reports.fees') ||
    can('reports.attendance') ||
    can('reports.academic') ||
    can('fees.invoice.read') ||
    can('attendance.read') ||
    can('attendance.report') ||
    can('exams.result.publish') ||
    can('exams.reportcard.generate');
  if (user?.role === 'super_admin' || !allowed) {
    return <Navigate to="/forbidden" replace />;
  }
  return <ReportsPage />;
}

function AuditRoute() {
  const user = useAppSelector(selectUser);
  const { can } = usePermission();
  const allowed =
    can('audit.read') || can('settings.users.manage') || can('settings.school.edit');
  if (user?.role === 'super_admin' || !allowed) {
    return <Navigate to="/forbidden" replace />;
  }
  return <AuditLogPage />;
}

const router = createBrowserRouter([
  {
    element: <GuestRoute />,
    children: [{ path: '/login', element: <LoginPage /> }],
  },
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/', element: <Navigate to="/dashboard" replace /> },
      { path: '/dashboard', element: <DashboardRouter /> },
      { path: '/profile', element: <ProfilePage /> },
      { path: '/settings', element: <SchoolSettingsRoute /> },
      {
        element: <StudentsRoute permission="students.read" />,
        children: [
          { path: '/students', element: <StudentsListPage /> },
          { path: '/students/id-cards', element: <StudentIdCardsPage /> },
          { path: '/students/promote', element: <PromoteStudentsRoute /> },
          {
            path: '/students/new',
            element: (
              <RequireStudentPermission permission="students.create">
                <StudentCreatePage />
              </RequireStudentPermission>
            ),
          },
          { path: '/students/:id', element: <StudentDetailPage /> },
          {
            path: '/students/:id/edit',
            element: (
              <RequireStudentPermission permission="students.update">
                <StudentEditPage />
              </RequireStudentPermission>
            ),
          },
        ],
      },
      {
        element: <TeachersRoute />,
        children: [
          { path: '/teachers', element: <TeachersListPage /> },
          { path: '/teachers/:id', element: <TeacherDetailPage /> },
        ],
      },
      { path: '/classes', element: <Navigate to="/settings/classes" replace /> },
      {
        element: <FeesRoute />,
        children: [
          { path: '/fees', element: <FeesPage /> },
          { path: '/fees/vouchers/:id', element: <FeeVoucherPage /> },
        ],
      },
      { path: '/expenses', element: <ExpensesRoute /> },
      {
        element: <ExamsRoute />,
        children: [
          { path: '/exams', element: <ExamsListPage /> },
          { path: '/exams/:id', element: <ExamDetailPage /> },
          { path: '/exams/:id/report-cards', element: <ExamReportCardsPage /> },
        ],
      },
      { path: '/reports', element: <ReportsRoute /> },
      { path: '/audit', element: <AuditRoute /> },
      {
        element: <AttendanceRoute />,
        children: [
          { path: '/attendance', element: <AttendancePage /> },
          { path: '/attendance/scan', element: <AttendanceScanRoute /> },
        ],
      },
      { path: '/notices', element: <NoticesRoute /> },
      { path: '/diary', element: <DiaryRoute /> },
      { path: '/session-years', element: <SessionYearsRoute /> },
      { path: '/settings/roles', element: <CustomRolesRoute /> },
      {
        element: <AcademicRoute />,
        children: [
          { path: '/settings/classes', element: <ClassesListPage /> },
          { path: '/settings/classes/:id', element: <ClassDetailPage /> },
          { path: '/settings/subjects', element: <SubjectsListPage /> },
        ],
      },
      {
        element: <StaffRoute />,
        children: [
          { path: '/settings/staff', element: <StaffListPage /> },
          { path: '/settings/staff/new', element: <StaffCreatePage /> },
          { path: '/settings/staff/:id', element: <StaffDetailPage /> },
          { path: '/settings/staff/:id/edit', element: <StaffEditPage /> },
        ],
      },
      { path: '/subscriptions', element: <SectionRoute title="Subscriptions" superAdminOnly /> },
      { path: '/billing', element: <SectionRoute title="Billing" superAdminOnly /> },
      { path: '/permissions', element: <SectionRoute title="Permissions" superAdminOnly /> },
      { path: '/system-roles', element: <SectionRoute title="System roles" superAdminOnly /> },
      { path: '/analytics', element: <SectionRoute title="Analytics" superAdminOnly /> },
      {
        element: <SupportRoute />,
        children: [
          { path: '/support', element: <SupportListRoute /> },
          { path: '/support/:id', element: <SupportDetailRoute /> },
        ],
      },
      {
        element: <SuperAdminRoute />,
        children: [
          { path: '/schools', element: <SchoolsListPage /> },
          { path: '/schools/new', element: <SchoolCreatePage /> },
          { path: '/schools/:id', element: <SchoolDetailPage /> },
        ],
      },
    ],
  },
  { path: '/forbidden', element: <Forbidden /> },
  { path: '*', element: <NotFound /> },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
