import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
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
    <Modal
      title={role.displayName}
      description={role.description || 'No description provided.'}
      size="lg"
      onClose={onClose}
      footer={<Button type="button" variant="outline" onClick={onClose}>Close</Button>}
    >
      <div className="space-y-4">
        <RoleBadge name={role.name} color={role.color} isSystem={role.isSystem} />
        <p className="text-sm text-ink-600">{role.permissions.length} permissions · {role.userCount} assigned users</p>
        {role.permissions.length === 0 ? (
          <p className="rounded-xl bg-surface-muted p-4 text-sm text-ink-500">No permissions assigned.</p>
        ) : (
          Object.entries(permissionsByModule).map(([module, permissions]) => (
            <section key={module} className="rounded-xl border border-ink-200 p-4">
              <h3 className="mb-3 text-sm font-semibold capitalize text-ink-950">{module} ({permissions.length})</h3>
              <div className="flex flex-wrap gap-2">
                {permissions.map((permission) => <code key={permission} className="break-all rounded-md bg-ink-100 px-2.5 py-1 font-mono text-xs text-ink-700">{permission}</code>)}
              </div>
            </section>
          ))
        )}
      </div>
    </Modal>
  );
}
