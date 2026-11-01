import { useMemo, useState } from 'react';
import { Lock, Plus, ShieldCheck, Users } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Modal } from '@/components/ui/modal';
import { MetricCard, MetricGrid } from '@/components/ui/metric-card';
import { PageShell } from '@/components/ui/page-shell';
import { PageLoader } from '@/components/ui/spinner';
import { DeleteRoleDialog } from '../components/DeleteRoleDialog';
import { RoleCard } from '../components/RoleCard';
import { RoleFilters } from '../components/RoleFilters';
import { RoleForm } from '../components/RoleForm';
import { RoleViewModal } from '../components/RoleViewModal';
import { useRoles, type Role } from '../hooks/useRoles';

type FormDialogState = { mode: 'create' } | { mode: 'edit'; role: Role } | null;
const EMPTY_ROLES: Role[] = [];

export function RolesListPage() {
  const [search, setSearch] = useState('');
  const [formDialog, setFormDialog] = useState<FormDialogState>(null);
  const [viewRole, setViewRole] = useState<Role | null>(null);
  const [deleteRole, setDeleteRole] = useState<Role | null>(null);
  const rolesQuery = useRoles();
  const roles = rolesQuery.data ?? EMPTY_ROLES;

  const visibleRoles = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    if (!term) return roles;
    return roles.filter((role) =>
      `${role.name} ${role.displayName} ${role.description ?? ''}`
        .toLocaleLowerCase()
        .includes(term),
    );
  }, [roles, search]);

  const closeForm = () => setFormDialog(null);

  return (
    <AppLayout>
      <PageShell
        eyebrow="Administration"
        title="Custom roles"
        description="Create roles and control which permissions staff members receive."
        actions={
          <Button type="button" onClick={() => setFormDialog({ mode: 'create' })}>
            <Plus className="h-4 w-4" aria-hidden="true" /> Create role
          </Button>
        }
      >
        {!rolesQuery.isPending && !rolesQuery.error && (
          <MetricGrid>
            <MetricCard
              icon={<ShieldCheck className="h-4 w-4" aria-hidden />}
              label="All roles"
              value={roles.length}
              tone="primary"
            />
            <MetricCard
              icon={<Lock className="h-4 w-4" aria-hidden />}
              label="System roles"
              value={roles.filter((role) => role.isSystem).length}
              tone="neutral"
            />
            <MetricCard
              icon={<Users className="h-4 w-4" aria-hidden />}
              label="Custom roles"
              value={roles.filter((role) => !role.isSystem).length}
              tone="success"
            />
          </MetricGrid>
        )}

        <RoleFilters value={search} onChange={setSearch} />

        {rolesQuery.isPending ? (
          <div className="panel">
            <PageLoader compact />
          </div>
        ) : rolesQuery.error ? (
          <section className="panel border-danger-100 p-8 text-center">
            <h2 className="font-display font-semibold text-ink-950">Failed to load roles</h2>
            <p className="mt-2 text-sm text-ink-600">{rolesQuery.error.message}</p>
            <Button
              type="button"
              variant="outline"
              className="mt-4"
              onClick={() => void rolesQuery.refetch()}
              isLoading={rolesQuery.isFetching}
            >
              Try again
            </Button>
          </section>
        ) : visibleRoles.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title={search ? 'No matching roles' : 'No roles available'}
            description={
              search
                ? 'Try another name or clear your search.'
                : 'Create a role to define staff permissions for your school.'
            }
            action={
              !search ? (
                <Button type="button" onClick={() => setFormDialog({ mode: 'create' })}>
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Create role
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {visibleRoles.map((role) => (
              <RoleCard
                key={role.id}
                role={role}
                onView={setViewRole}
                onEdit={(selected) => setFormDialog({ mode: 'edit', role: selected })}
                onDelete={setDeleteRole}
              />
            ))}
          </div>
        )}

        {formDialog && (
          <Modal
            onClose={closeForm}
            size="xl"
            title={
              formDialog.mode === 'create'
                ? 'Create custom role'
                : `Edit ${formDialog.role.displayName}`
            }
            description={
              formDialog.mode === 'create'
                ? 'Name the role, then choose the permissions it can access.'
                : 'Update role information and its assigned permissions.'
            }
          >
            <RoleForm
              key={formDialog.mode === 'create' ? 'create' : formDialog.role.id}
              role={formDialog.mode === 'edit' ? formDialog.role : undefined}
              onSuccess={closeForm}
              onCancel={closeForm}
            />
          </Modal>
        )}
        <RoleViewModal role={viewRole} onClose={() => setViewRole(null)} />
        <DeleteRoleDialog role={deleteRole} onClose={() => setDeleteRole(null)} />
      </PageShell>
    </AppLayout>
  );
}
