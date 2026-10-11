import { useAppSelector } from '@/store/hooks';
import { selectUser } from '@/store/selectors/permissions';
import { AppLayout } from '@/components/layout/AppLayout';

export function SuperAdminDashboard() {
  const user = useAppSelector(selectUser);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.fullName || 'Admin'}</h1>
          <p className="mt-1 text-sm text-gray-500">Super admin dashboard</p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total schools" />
          <StatCard label="Active schools" />
          <StatCard label="Monthly revenue" />
          <StatCard label="Payment due" />
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <div className="mb-4 text-5xl" aria-hidden="true">🚧</div>
          <h2 className="mb-2 text-lg font-semibold text-gray-900">Platform dashboard</h2>
          <p className="mx-auto max-w-md text-sm text-gray-500">School management and analytics will appear as platform data endpoints are connected.</p>
        </div>
      </div>
    </AppLayout>
  );
}

function StatCard({ label }: { label: string }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-1 text-sm text-gray-500">{label}</div>
      <div className="text-2xl font-bold text-gray-900">--</div>
      <div className="mt-1 text-xs text-gray-400">No data connected</div>
    </section>
  );
}
