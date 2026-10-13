import { Eye, Lock, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Role } from '../hooks/useRoles';
import { RoleBadge } from './RoleBadge';

interface RoleCardProps {
  role: Role;
  onView: (role: Role) => void;
  onEdit: (role: Role) => void;
  onDelete: (role: Role) => void;
}

export function RoleCard({ role, onView, onEdit, onDelete }: RoleCardProps) {
  return (
    <article className={`flex h-full flex-col rounded-xl border bg-white p-5 transition-shadow hover:shadow-md ${role.isSystem ? 'border-dashed border-gray-300' : 'border-gray-200'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl text-xl" style={{ backgroundColor: `${role.color ?? '#2563eb'}18`, color: role.color ?? '#2563eb' }} aria-hidden="true">
          {role.icon || role.displayName.slice(0, 1).toUpperCase()}
        </div>
        {role.isSystem && <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-gray-600"><Lock className="h-3 w-3" aria-hidden="true" />System</span>}
      </div>
      <div className="mt-4 flex-1">
        <h2 className="font-semibold text-gray-900">{role.displayName}</h2>
        <p className="mt-1 min-h-10 text-sm text-gray-500">{role.description || 'No description provided.'}</p>
        <div className="mt-3"><RoleBadge name={role.name} color={role.color} /></div>
      </div>
      <div className="my-4 flex gap-6 border-y border-gray-100 py-3">
        <div><p className="text-xs text-gray-500">Permissions</p><p className="mt-1 font-semibold text-gray-900">{role.permissions.length}</p></div>
        <div><p className="text-xs text-gray-500">Assigned users</p><p className="mt-1 font-semibold text-gray-900">{role.userCount}</p></div>
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => onView(role)}><Eye className="h-4 w-4" aria-hidden="true" />View</Button>
        {!role.isSystem && (
          <>
            <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => onEdit(role)}><Pencil className="h-4 w-4" aria-hidden="true" />Edit</Button>
            <Button type="button" variant="outline" size="sm" aria-label={`Delete ${role.displayName}`} onClick={() => onDelete(role)} disabled={role.userCount > 0} title={role.userCount > 0 ? 'Reassign users before deleting this role.' : 'Delete role'}>
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </Button>
          </>
        )}
      </div>
    </article>
  );
}
