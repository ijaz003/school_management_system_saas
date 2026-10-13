import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/50 p-4" role="presentation">
      <section role="alertdialog" aria-modal="true" aria-labelledby="delete-role-title" aria-describedby="delete-role-description" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-red-100"><AlertTriangle className="h-5 w-5 text-red-600" aria-hidden="true" /></span>
          <Button type="button" variant="ghost" size="sm" aria-label="Close delete confirmation" onClick={onClose} disabled={deleteRole.isPending}><X className="h-5 w-5" aria-hidden="true" /></Button>
        </div>
        <h2 id="delete-role-title" className="mt-4 text-lg font-semibold text-gray-900">Delete {role.displayName}?</h2>
        <p id="delete-role-description" className="mt-2 text-sm text-gray-600">
          {role.userCount > 0
            ? `This role is assigned to ${role.userCount} users. Reassign them before deleting this role.`
            : 'This action cannot be undone. The role will no longer be available for assignment.'}
        </p>
        <footer className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={deleteRole.isPending}>Cancel</Button>
          <Button type="button" variant="danger" onClick={confirmDelete} isLoading={deleteRole.isPending} disabled={deleteRole.isPending || role.userCount > 0}>Delete role</Button>
        </footer>
      </section>
    </div>
  );
}
