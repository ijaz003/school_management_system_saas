import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Lock, Plus, ShieldCheck, Users } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
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
      <div className="space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Custom roles</h1>
            <p className="mt-1 text-sm text-gray-500">Create roles and control which permissions staff members receive.</p>
          </div>
          <Button type="button" onClick={() => setFormDialog({ mode: 'create' })}>
            <Plus className="h-4 w-4" aria-hidden="true" /> Create role
          </Button>
        </header>

        {!rolesQuery.isPending && !rolesQuery.error && (
          <div className="grid gap-4 sm:grid-cols-3">
            <SummaryCard label="All roles" value={roles.length} icon={<ShieldCheck className="h-5 w-5" />} />
            <SummaryCard label="System roles" value={roles.filter((role) => role.isSystem).length} icon={<Lock className="h-5 w-5" />} />
            <SummaryCard label="Custom roles" value={roles.filter((role) => !role.isSystem).length} icon={<Users className="h-5 w-5" />} />
          </div>
        )}

        <RoleFilters value={search} onChange={setSearch} />

        {rolesQuery.isPending ? (
          <div className="rounded-xl border border-gray-200 bg-white p-12"><PageLoader /></div>
        ) : rolesQuery.error ? (
          <section className="rounded-xl border border-red-200 bg-white p-8 text-center">
            <h2 className="font-semibold text-gray-900">Failed to load roles</h2>
            <p className="mt-2 text-sm text-gray-600">{rolesQuery.error.message}</p>
            <Button type="button" variant="outline" className="mt-4" onClick={() => void rolesQuery.refetch()} isLoading={rolesQuery.isFetching}>Try again</Button>
          </section>
        ) : visibleRoles.length === 0 ? (
          <section className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center">
            <ShieldCheck className="mx-auto h-10 w-10 text-gray-300" aria-hidden="true" />
            <h2 className="mt-3 font-semibold text-gray-900">{search ? 'No matching roles' : 'No roles available'}</h2>
            <p className="mt-1 text-sm text-gray-500">{search ? 'Try another name or clear your search.' : 'Create a role to define staff permissions for your school.'}</p>
            {!search && <Button type="button" className="mt-5" onClick={() => setFormDialog({ mode: 'create' })}><Plus className="h-4 w-4" aria-hidden="true" />Create role</Button>}
          </section>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/50 p-4" role="presentation">
            <section role="dialog" aria-modal="true" aria-labelledby="role-form-title" className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl md:p-7">
              <header className="mb-5">
                <h2 id="role-form-title" className="text-xl font-bold text-gray-900">{formDialog.mode === 'create' ? 'Create custom role' : `Edit ${formDialog.role.displayName}`}</h2>
                <p className="mt-1 text-sm text-gray-500">{formDialog.mode === 'create' ? 'Name the role, then choose the permissions it can access.' : 'Update role information and its assigned permissions.'}</p>
              </header>
              <RoleForm
                key={formDialog.mode === 'create' ? 'create' : formDialog.role.id}
                role={formDialog.mode === 'edit' ? formDialog.role : undefined}
                onSuccess={closeForm}
                onCancel={closeForm}
              />
            </section>
          </div>
        )}
        <RoleViewModal role={viewRole} onClose={() => setViewRole(null)} />
        <DeleteRoleDialog role={deleteRole} onClose={() => setDeleteRole(null)} />
      </div>
    </AppLayout>
  );
}

function SummaryCard({ label, value, icon }: { label: string; value: number; icon: ReactNode }) {
  return (
    <section className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">{icon}</span>
      <div><p className="text-sm text-gray-500">{label}</p><p className="text-xl font-bold text-gray-900">{value}</p></div>
    </section>
  );
}
