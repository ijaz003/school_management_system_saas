import { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDeleteSchool } from '../hooks/useDeleteSchool';
import type { School } from '../hooks/useSchools';

interface DeleteSchoolDialogProps {
  school: School;
  isOpen: boolean;
  onClose: () => void;
}

export function DeleteSchoolDialog({ school, isOpen, onClose }: DeleteSchoolDialogProps) {
  const navigate = useNavigate();
  const deleteSchool = useDeleteSchool();
  const [confirmText, setConfirmText] = useState('');
  const isConfirmed = confirmText.trim() === school.name;

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !deleteSchool.isPending) handleClose();
    };

    function handleClose() {
      setConfirmText('');
      onClose();
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [deleteSchool.isPending, isOpen, onClose]);

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
        navigate('/schools', { replace: true });
      },
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) handleClose();
      }}
    >
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-school-title"
        aria-describedby="delete-school-description"
        className="w-full max-w-md rounded-xl bg-white shadow-xl"
      >
        <header className="flex items-center justify-between border-b border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" aria-hidden="true" />
            </span>
            <h2 id="delete-school-title" className="text-lg font-semibold text-gray-900">
              Delete school
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={deleteSchool.isPending}
            className="rounded-lg p-1 hover:bg-gray-100 disabled:opacity-50"
            aria-label="Close delete school dialog"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </header>

        <div className="space-y-4 p-6">
          <p id="delete-school-description" className="text-sm text-gray-700">
            You are about to delete <strong>{school.name}</strong>.
          </p>

          <div className="space-y-2 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">This action will:</p>
            <ul className="ml-4 list-disc space-y-1 text-xs text-red-700">
              <li>Mark the school account as cancelled and deleted.</li>
              <li>Deactivate its users and revoke their refresh tokens.</li>
              <li>Keep the school record soft-deleted; no timed permanent purge is configured.</li>
            </ul>
          </div>

          <div>
            <label htmlFor="confirm-school-name" className="mb-2 block text-sm font-medium text-gray-700">
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

          <footer className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={deleteSchool.isPending}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleDelete}
              disabled={!isConfirmed}
              isLoading={deleteSchool.isPending}
              className="flex-1"
            >
              Delete school
            </Button>
          </footer>
        </div>
      </section>
    </div>
  );
}
