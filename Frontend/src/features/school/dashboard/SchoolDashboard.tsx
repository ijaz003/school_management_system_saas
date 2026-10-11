import { useAppSelector } from '@/store/hooks';
import { selectUser } from '@/store/selectors/permissions';
import { AppLayout } from '@/components/layout/AppLayout';

export function SchoolDashboard() {
  const user = useAppSelector(selectUser);
  const firstName = user?.fullName.split(' ')[0] || 'there';

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {firstName}!</h1>
          <p className="mt-1 text-sm text-gray-500">{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total students" />
          <StatCard label="Present today" />
          <StatCard label="Fees collected" />
          <StatCard label="Pending fees" />
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <div className="mb-4 text-5xl" aria-hidden="true">🚧</div>
          <h2 className="mb-2 text-lg font-semibold text-gray-900">Dashboard under construction</h2>
          <p className="mx-auto max-w-md text-sm text-gray-500">Dashboard statistics and charts will appear once the related data endpoints are connected.</p>
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
