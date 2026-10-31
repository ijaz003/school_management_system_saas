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
import { NoticesListPage } from '@/features/school/notices/pages/NoticesListPage';
import { FeesPage } from '@/features/school/fees/pages/FeesPage';
import { ExamsListPage } from '@/features/school/exams/pages/ExamsListPage';
import { ExamDetailPage } from '@/features/school/exams/pages/ExamDetailPage';
import { SchoolSettingsPage } from '@/features/school/settings/pages/SchoolSettingsPage';
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
      <section className="rounded-xl border border-gray-200 bg-white p-8">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="mt-2 text-sm text-gray-500">This section is not available yet.</p>
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
  return <AttendancePage />;
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
  return <FeesPage />;
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
      { path: '/fees', element: <FeesRoute /> },
      {
        element: <ExamsRoute />,
        children: [
          { path: '/exams', element: <ExamsListPage /> },
          { path: '/exams/:id', element: <ExamDetailPage /> },
        ],
      },
      { path: '/attendance', element: <AttendanceRoute /> },
      { path: '/notices', element: <NoticesRoute /> },
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
      { path: '/support', element: <SectionRoute title="Support" superAdminOnly /> },
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
