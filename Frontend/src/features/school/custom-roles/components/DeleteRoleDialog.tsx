import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import type { Role } from '../hooks/useRoles';
import { useDeleteRole } from '../hooks/useDeleteRole';

interface DeleteRoleDialogProps {
  role: Role | null;
  onClose: () => void;
}

export function DeleteRoleDialog({ role, onClose }: DeleteRoleDialogProps) {
  const deleteRole = useDeleteRole();
  if (!role) return null;

  const confirmDelete = () => {
    deleteRole.mutate(role.id, { onSuccess: onClose });
  };

  return (
    <Modal
      title={`Delete ${role.displayName}?`}
      description={role.userCount > 0
        ? `This role is assigned to ${role.userCount} users. Reassign them before deleting this role.`
        : 'This action cannot be undone. The role will no longer be available for assignment.'}
      size="sm"
      variant="danger"
      role="alertdialog"
      onClose={onClose}
      closeDisabled={deleteRole.isPending}
      closeOnOverlay={false}
      footer={(
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={deleteRole.isPending}>Cancel</Button>
          <Button type="button" variant="danger" onClick={confirmDelete} isLoading={deleteRole.isPending} disabled={deleteRole.isPending || role.userCount > 0}>Delete role</Button>
        </>
      )}
    >
      <p className="rounded-xl bg-surface-muted px-3 py-2 font-mono text-xs text-ink-700">{role.name}</p>
    </Modal>
  );
}
