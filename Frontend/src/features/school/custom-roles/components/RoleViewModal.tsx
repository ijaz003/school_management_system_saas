import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Role } from '../hooks/useRoles';
import { RoleBadge } from './RoleBadge';

interface RoleViewModalProps {
  role: Role | null;
  onClose: () => void;
}

export function RoleViewModal({ role, onClose }: RoleViewModalProps) {
  if (!role) return null;

  const permissionsByModule = role.permissions.reduce<Record<string, string[]>>((groups, permission) => {
    const module = permission.split('.')[0] ?? 'Other';
    (groups[module] ??= []).push(permission);
    return groups;
  }, {});

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/50 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="view-role-title" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
        <header className="flex items-start justify-between gap-4 border-b border-gray-200 p-5">
          <div>
            <h2 id="view-role-title" className="text-lg font-semibold text-gray-900">{role.displayName}</h2>
            <p className="mt-1 text-sm text-gray-500">{role.description || 'No description provided.'}</p>
            <div className="mt-3"><RoleBadge name={role.name} color={role.color} isSystem={role.isSystem} /></div>
          </div>
          <Button type="button" variant="ghost" size="sm" aria-label="Close role details" onClick={onClose}><X className="h-5 w-5" aria-hidden="true" /></Button>
        </header>
        <div className="space-y-4 p-5">
          <p className="text-sm text-gray-600">{role.permissions.length} permissions · {role.userCount} assigned users</p>
          {role.permissions.length === 0 ? (
            <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">No permissions assigned.</p>
          ) : (
            Object.entries(permissionsByModule).map(([module, permissions]) => (
              <section key={module} className="rounded-xl border border-gray-200 p-4">
                <h3 className="mb-3 text-sm font-semibold capitalize text-gray-900">{module} ({permissions.length})</h3>
                <div className="flex flex-wrap gap-2">
                  {permissions.map((permission) => <code key={permission} className="rounded-md bg-gray-100 px-2.5 py-1 font-mono text-xs text-gray-700">{permission}</code>)}
                </div>
              </section>
            ))
          )}
        </div>
        <footer className="flex justify-end border-t border-gray-200 p-4"><Button type="button" variant="outline" onClick={onClose}>Close</Button></footer>
      </section>
    </div>
  );
}
