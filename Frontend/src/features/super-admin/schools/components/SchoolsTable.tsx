import { useState } from 'react';
import type { ReactNode } from 'react';
import { Ban, CheckCircle, Edit, Eye, School as SchoolIcon, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { formatDate } from '@/lib/datetime';
import { normalizeLocale } from '@/lib/tenant-locale';
import { DeleteSchoolDialog } from './DeleteSchoolDialog';
import { EditSchoolModal } from './EditSchoolModal';
import { StatusBadge } from './StatusBadge';
import { useActivateSchool } from '../hooks/useActivateSchool';
import { useSuspendSchool } from '../hooks/useSuspendSchool';
import type { School } from '../hooks/useSchools';

export function SchoolsTable({ schools }: { schools: School[] }) {
  const navigate = useNavigate();
  const suspendSchool = useSuspendSchool();
  const activateSchool = useActivateSchool();
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [deletingSchool, setDeletingSchool] = useState<School | null>(null);
  const [suspendingSchool, setSuspendingSchool] = useState<School | null>(null);

  if (schools.length === 0) {
    return (
      <div className="p-4 sm:p-6">
        <EmptyState
          icon={SchoolIcon}
          title="No schools found"
          description="Try changing the filters or create a school."
        />
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left">
          <thead className="sticky top-0 bg-ink-50">
            <tr className="border-b border-ink-100">
              {['School', 'Owner', 'Plan', 'Status', 'Created', 'Actions'].map((label) => (
                <th key={label} scope="col" className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-500">{label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {schools.map((school) => (
              <tr key={school.id} className="transition-colors hover:bg-ink-50">
                <td className="px-4 py-4">
                  <div className="font-medium text-ink-950">{school.name}</div>
                  <div className="mt-0.5 text-xs text-ink-500">{school.slug}</div>
                </td>
                <td className="px-4 py-4">
                  <div className="text-sm text-ink-950">{school.ownerName}</div>
                  <div className="text-xs text-ink-500">{school.ownerEmail}</div>
                </td>
                <td className="px-4 py-4 text-sm capitalize text-ink-700">{school.plan}</td>
                <td className="px-4 py-4"><StatusBadge status={school.status} /></td>
                <td className="whitespace-nowrap px-4 py-4 text-sm text-ink-500">{formatDate(school.createdAt, normalizeLocale(school.settings))}</td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap items-center justify-end gap-1">
                    <ActionButton
                      icon={<Eye className="h-4 w-4" aria-hidden="true" />}
                      label="View"
                      onClick={() => navigate(`/schools/${school.id}`)}
                    />
                    <ActionButton
                      icon={<Edit className="h-4 w-4" aria-hidden="true" />}
                      label="Edit"
                      onClick={() => setEditingSchool(school)}
                    />
                    {school.status === 'active' && (
                      <ActionButton
                        icon={<Ban className="h-4 w-4" aria-hidden="true" />}
                        label="Suspend"
                        variant="warning"
                        disabled={suspendSchool.isPending}
                        onClick={() => setSuspendingSchool(school)}
                      />
                    )}
                    {school.status === 'suspended' && (
                      <ActionButton
                        icon={<CheckCircle className="h-4 w-4" aria-hidden="true" />}
                        label="Activate"
                        variant="success"
                        disabled={activateSchool.isPending}
                        onClick={() => activateSchool.mutate(school.id)}
                      />
                    )}
                    <ActionButton
                      icon={<Trash2 className="h-4 w-4" aria-hidden="true" />}
                      label="Delete"
                      variant="danger"
                      onClick={() => setDeletingSchool(school)}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingSchool && (
        <EditSchoolModal
          school={editingSchool}
          isOpen
          onClose={() => setEditingSchool(null)}
        />
      )}
      <ConfirmDialog
        open={suspendingSchool !== null}
        title="Suspend school"
        description={suspendingSchool ? `Suspend ${suspendingSchool.name}?` : ''}
        confirmLabel="Suspend"
        loading={suspendSchool.isPending}
        onClose={() => setSuspendingSchool(null)}
        onConfirm={() => {
          if (!suspendingSchool) return;
          suspendSchool.mutate(suspendingSchool.id, { onSettled: () => setSuspendingSchool(null) });
        }}
      />
      {deletingSchool && (
        <DeleteSchoolDialog
          school={deletingSchool}
          isOpen
          redirectOnDelete={false}
          onClose={() => setDeletingSchool(null)}
        />
      )}
    </>
  );
}

interface ActionButtonProps {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  disabled?: boolean;
}

function ActionButton({
  icon,
  label,
  onClick,
  variant = 'default',
  disabled = false,
}: ActionButtonProps) {
  const variants = {
    default: 'text-ink-600 hover:bg-ink-100 hover:text-ink-950',
    success: 'text-success-700 hover:bg-success-50',
    warning: 'text-warning-700 hover:bg-warning-50',
    danger: 'text-danger-600 hover:bg-danger-50 hover:text-danger-700',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]}`}
    >
      {icon}
      <span className="hidden lg:inline">{label}</span>
    </button>
  );
}
