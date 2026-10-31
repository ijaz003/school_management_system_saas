import { useState } from 'react';
import { Copy, GraduationCap, Plus, UserCheck, UserX, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { PageHeader } from '@/components/ui/page-header';
import { TableSkeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/ui/stat-card';
import { StaffFilters } from '../components/StaffFilters';
import { StaffTable } from '../components/StaffTable';
import { useDeleteStaff } from '../hooks/useDeleteStaff';
import { useResetPassword } from '../hooks/useResetPassword';
import type { ResetPasswordResponse } from '../hooks/useResetPassword';
import type { StaffFilters as Filters } from '../hooks/keys';
import { useStaff, type StaffMember } from '../hooks/useStaff';

type PendingAction = { kind: 'delete' | 'reset'; staff: StaffMember } | null;

export function StaffListPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<Filters>({ page: 1, limit: 20 });
  const [resetResult, setResetResult] = useState<ResetPasswordResponse | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const staffQuery = useStaff(filters);
  const deleteStaff = useDeleteStaff();
  const resetPassword = useResetPassword();
  const items = staffQuery.data?.items ?? [];

  const handleDelete = (staff: StaffMember) => setPendingAction({ kind: 'delete', staff });
  const handleReset = (staff: StaffMember) => setPendingAction({ kind: 'reset', staff });

  const confirmPending = () => {
    if (!pendingAction) return;
    const { kind, staff } = pendingAction;
    if (kind === 'delete') {
      deleteStaff.mutate(staff.id, { onSettled: () => setPendingAction(null) });
      return;
    }
    resetPassword.mutate(staff.id, {
      onSuccess: (result) => {
        setResetResult(result);
        toast.success(`Password reset for ${result.email}`);
      },
      onSettled: () => setPendingAction(null),
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
        <PageHeader
          eyebrow="Administration"
          title="Staff"
          description="Manage teachers, accountants, and support staff."
          actions={
            <Button onClick={() => navigate('/settings/staff/new')}>
              <Plus className="h-4 w-4" aria-hidden="true" /> Add staff
            </Button>
          }
        />

        {pagination && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total staff" value={pagination.total} icon={Users} />
            <StatCard
              label="Active on this page"
              value={items.filter((item) => item.isActive).length}
              icon={UserCheck}
            />
            <StatCard
              label="Teachers on this page"
              value={items.filter((item) => item.role === 'teacher').length}
              icon={GraduationCap}
            />
            <StatCard
              label="Inactive on this page"
              value={items.filter((item) => !item.isActive).length}
              icon={UserX}
            />
          </div>
        )}

        <StaffFilters value={filters} onChange={setFilters} />

        {resetResult && (
          <section className="rounded-2xl border border-warning-100 bg-warning-50 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-warning-700">
                  Temporary password for {resetResult.email}
                </h2>
                <p className="mt-1 text-xs text-warning-700">
                  This password is shown only once. Share it securely with the staff member.
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => setResetResult(null)}>
                Dismiss
              </Button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <code className="min-w-0 flex-1 break-all rounded-xl border border-warning-100 bg-white px-3 py-2 font-mono text-sm text-ink-900">
                {resetResult.tempPassword}
              </code>
              <Button type="button" variant="outline" onClick={copyResetPassword}>
                <Copy className="h-4 w-4" aria-hidden="true" /> Copy
              </Button>
            </div>
          </section>
        )}

        {staffQuery.isPending ? (
          <TableSkeleton rows={6} />
        ) : staffQuery.error ? (
          <section className="panel border-danger-100 p-8 text-center">
            <h2 className="font-display font-semibold text-ink-950">Failed to load staff</h2>
            <p className="mt-2 text-sm text-ink-600">{staffQuery.error.message}</p>
            <Button
              className="mt-4"
              variant="outline"
              onClick={() => void staffQuery.refetch()}
              isLoading={staffQuery.isFetching}
            >
              Try again
            </Button>
          </section>
        ) : staffQuery.data ? (
          <section className="panel overflow-hidden p-0">
            <StaffTable
              staff={staffQuery.data.items}
              onEdit={(member) => navigate(`/settings/staff/${member.id}/edit`)}
              onDelete={handleDelete}
              onResetPassword={handleReset}
              busy={deleteStaff.isPending || resetPassword.isPending}
            />
            {pagination && pagination.totalPages > 1 && (
              <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 bg-ink-50 px-4 py-4 sm:px-5">
                <p className="text-sm text-ink-500">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page <= 1}
                    onClick={() =>
                      setFilters((current) => ({ ...current, page: pagination.page - 1 }))
                    }
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-ink-600">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() =>
                      setFilters((current) => ({ ...current, page: pagination.page + 1 }))
                    }
                  >
                    Next
                  </Button>
                </div>
              </footer>
            )}
          </section>
        ) : null}

        <ConfirmDialog
          open={pendingAction !== null}
          title={pendingAction?.kind === 'delete' ? 'Delete staff member' : 'Reset password'}
          description={
            pendingAction
              ? pendingAction.kind === 'delete'
                ? `Delete "${pendingAction.staff.fullName}"? Their account will be deactivated and their sessions revoked.`
                : `Reset the password for "${pendingAction.staff.fullName}"?`
              : ''
          }
          confirmLabel={pendingAction?.kind === 'delete' ? 'Delete' : 'Reset password'}
          variant={pendingAction?.kind === 'delete' ? 'danger' : 'default'}
          loading={deleteStaff.isPending || resetPassword.isPending}
          onClose={() => setPendingAction(null)}
          onConfirm={confirmPending}
        />
      </div>
    </AppLayout>
  );
}
