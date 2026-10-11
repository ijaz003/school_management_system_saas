import { createBrowserRouter, Navigate, Outlet, RouterProvider } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { SchoolDashboard } from '@/features/school/dashboard/SchoolDashboard';
import { SuperAdminDashboard } from '@/features/super-admin/dashboard/SuperAdminDashboard';
import { SchoolsListPage } from '@/features/super-admin/schools/pages/SchoolsListPage';
import { SchoolCreatePage } from '@/features/super-admin/schools/pages/SchoolCreatePage';
import { SchoolDetailPage } from '@/features/super-admin/schools/pages/SchoolDetailPage';
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
      { path: '/profile', element: <PlaceholderPage title="My profile" /> },
      { path: '/settings', element: <SectionRoute title="Settings" permission="settings.school.edit" /> },
      { path: '/students', element: <SectionRoute title="Students" permission="students.read" /> },
      { path: '/teachers', element: <SectionRoute title="Teachers" permission="teachers.read" /> },
      { path: '/classes', element: <SectionRoute title="Classes" permission="classes.read" /> },
      { path: '/fees', element: <SectionRoute title="Fees" permission="fees.invoice.read" /> },
      { path: '/exams', element: <SectionRoute title="Exams" permission="exams.marks.enter" /> },
      { path: '/attendance', element: <SectionRoute title="Attendance" permission="attendance.read" /> },
      { path: '/notices', element: <SectionRoute title="Notices" permission="notices.read" /> },
      { path: '/settings/roles', element: <SectionRoute title="Custom roles" permission="settings.roles.manage" /> },
      { path: '/settings/staff', element: <SectionRoute title="Staff" permission="settings.users.manage" /> },
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
