import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { useDeleteSchool } from '../hooks/useDeleteSchool';
import type { School } from '../hooks/useSchools';

interface DeleteSchoolDialogProps {
  school: School;
  isOpen: boolean;
  redirectOnDelete?: boolean;
  onClose: () => void;
}

export function DeleteSchoolDialog({
  school,
  isOpen,
  redirectOnDelete = true,
  onClose,
}: DeleteSchoolDialogProps) {
  const navigate = useNavigate();
  const deleteSchool = useDeleteSchool();
  const [confirmText, setConfirmText] = useState('');
  const isConfirmed = confirmText.trim() === school.name;

  if (!isOpen) return null;

  const handleClose = () => {
    if (deleteSchool.isPending) return;
    setConfirmText('');
    onClose();
  };

  const handleDelete = () => {
    if (!isConfirmed || deleteSchool.isPending) return;

    deleteSchool.mutate(school.id, {
      onSuccess: () => {
        setConfirmText('');
        onClose();
        if (redirectOnDelete) navigate('/schools', { replace: true });
      },
    });
  };

  return (
    <Modal
      title="Delete school"
      description={`You are about to delete ${school.name}.`}
      size="sm"
      variant="danger"
      role="alertdialog"
      onClose={handleClose}
      closeDisabled={deleteSchool.isPending}
      footer={(
        <>
          <Button type="button" variant="outline" onClick={handleClose} disabled={deleteSchool.isPending}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={handleDelete}
            disabled={!isConfirmed}
            isLoading={deleteSchool.isPending}
          >
            Delete school
          </Button>
        </>
      )}
    >
      <div className="space-y-4">
        <div className="space-y-2 rounded-xl border border-danger-100 bg-danger-50 p-4">
          <p className="text-sm font-medium text-danger-700">This action will:</p>
          <ul className="ml-4 list-disc space-y-1 text-xs text-danger-700">
            <li>Mark the school account as cancelled and deleted.</li>
            <li>Deactivate its users and revoke their refresh tokens.</li>
            <li>Keep the school record soft-deleted; no timed permanent purge is configured.</li>
          </ul>
        </div>

        <div>
          <label htmlFor="confirm-school-name" className="mb-2 block text-sm font-medium text-ink-800">
            Type <span className="font-mono font-bold">{school.name}</span> to confirm:
          </label>
          <Input
            id="confirm-school-name"
            autoComplete="off"
            value={confirmText}
            onChange={(event) => setConfirmText(event.target.value)}
            disabled={deleteSchool.isPending}
          />
        </div>
      </div>
    </Modal>
  );
}
