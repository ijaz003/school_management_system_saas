import { useState } from 'react';
import { Copy, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { PageLoader } from '@/components/ui/spinner';
import { StaffFilters } from '../components/StaffFilters';
import { StaffTable } from '../components/StaffTable';
import { useDeleteStaff } from '../hooks/useDeleteStaff';
import { useResetPassword } from '../hooks/useResetPassword';
import type { ResetPasswordResponse } from '../hooks/useResetPassword';
import type { StaffFilters as Filters } from '../hooks/keys';
import { useStaff, type StaffMember } from '../hooks/useStaff';

export function StaffListPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<Filters>({ page: 1, limit: 20 });
  const [resetResult, setResetResult] = useState<ResetPasswordResponse | null>(null);
  const staffQuery = useStaff(filters);
  const deleteStaff = useDeleteStaff();
  const resetPassword = useResetPassword();
  const items = staffQuery.data?.items ?? [];

  const handleDelete = (staff: StaffMember) => {
    if (window.confirm(`Delete "${staff.fullName}"? Their account will be deactivated and their sessions revoked.`)) {
      deleteStaff.mutate(staff.id);
    }
  };

  const handleReset = (staff: StaffMember) => {
    if (!window.confirm(`Reset the password for "${staff.fullName}"?`)) return;
    resetPassword.mutate(staff.id, {
      onSuccess: (result) => {
        setResetResult(result);
        toast.success(`Password reset for ${result.email}`);
      },
    });
  };

  const copyResetPassword = async () => {
    if (!resetResult) return;
    try {
      await navigator.clipboard.writeText(resetResult.tempPassword);
      toast.success('Temporary password copied');
    } catch {
      toast.error('Could not copy the password. Select and copy it manually.');
    }
  };

  const pagination = staffQuery.data?.pagination;

  return (
    <AppLayout>
      <div className="space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Staff</h1>
            <p className="mt-1 text-sm text-gray-500">Manage teachers, accountants, and support staff.</p>
          </div>
          <Button onClick={() => navigate('/settings/staff/new')}>
            <Plus className="h-4 w-4" aria-hidden="true" /> Add staff
          </Button>
        </header>

        {pagination && (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Total staff" value={pagination.total} tone="blue" />
            <StatCard label="Active on this page" value={items.filter((item) => item.isActive).length} tone="green" />
            <StatCard label="Teachers on this page" value={items.filter((item) => item.role === 'teacher').length} tone="orange" />
            <StatCard label="Inactive on this page" value={items.filter((item) => !item.isActive).length} tone="gray" />
          </div>
        )}

        <StaffFilters value={filters} onChange={setFilters} />

        {resetResult && (
          <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-amber-900">Temporary password for {resetResult.email}</h2>
                <p className="mt-1 text-xs text-amber-800">This password is shown only once. Share it securely with the staff member.</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => setResetResult(null)}>Dismiss</Button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <code className="min-w-0 flex-1 break-all rounded-lg border border-amber-200 bg-white px-3 py-2 font-mono text-sm text-gray-900">{resetResult.tempPassword}</code>
              <Button type="button" variant="outline" onClick={copyResetPassword}>
                <Copy className="h-4 w-4" aria-hidden="true" /> Copy
              </Button>
            </div>
          </section>
        )}

        {staffQuery.isPending ? (
          <div className="rounded-xl border border-gray-200 bg-white p-12"><PageLoader /></div>
        ) : staffQuery.error ? (
          <section className="rounded-xl border border-red-200 bg-white p-8 text-center">
            <h2 className="font-semibold text-gray-900">Failed to load staff</h2>
            <p className="mt-2 text-sm text-gray-600">{staffQuery.error.message}</p>
            <Button className="mt-4" variant="outline" onClick={() => void staffQuery.refetch()} isLoading={staffQuery.isFetching}>Try again</Button>
          </section>
        ) : staffQuery.data ? (
          <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <StaffTable
              staff={staffQuery.data.items}
              onEdit={(member) => navigate(`/settings/staff/${member.id}/edit`)}
              onDelete={handleDelete}
              onResetPassword={handleReset}
              busy={deleteStaff.isPending || resetPassword.isPending}
            />
            {pagination && pagination.totalPages > 1 && (
              <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 bg-gray-50 px-5 py-4">
                <p className="text-sm text-gray-500">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => setFilters((current) => ({ ...current, page: pagination.page - 1 }))}>Previous</Button>
                  <span className="text-sm text-gray-600">Page {pagination.page} of {pagination.totalPages}</span>
                  <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => setFilters((current) => ({ ...current, page: pagination.page + 1 }))}>Next</Button>
                </div>
              </footer>
            )}
          </section>
        ) : null}
      </div>
    </AppLayout>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone: 'blue' | 'green' | 'orange' | 'gray' }) {
  const tones = {
    blue: 'text-blue-700 bg-blue-50',
    green: 'text-green-700 bg-green-50',
    orange: 'text-orange-700 bg-orange-50',
    gray: 'text-gray-700 bg-gray-50',
  };
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`mt-2 inline-flex rounded-lg px-2.5 py-1 text-xl font-bold ${tones[tone]}`}>{value}</p>
    </section>
  );
}
