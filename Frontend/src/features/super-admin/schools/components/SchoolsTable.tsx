import { useState } from 'react';
import type { ReactNode } from 'react';
import { Ban, CheckCircle, Edit, Eye, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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

  if (schools.length === 0) {
    return (
      <div className="p-12 text-center">
        <div className="mb-4 text-4xl" aria-hidden="true">🏫</div>
        <h2 className="mb-2 text-lg font-semibold text-gray-900">No schools found</h2>
        <p className="text-sm text-gray-500">Try changing the filters or create a school.</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-200">
              {['School', 'Owner', 'Plan', 'Status', 'Created', 'Actions'].map((label) => (
                <th key={label} scope="col" className="whitespace-nowrap px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">{label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {schools.map((school) => (
              <tr key={school.id} className="transition-colors hover:bg-gray-50">
                <td className="px-4 py-4">
                  <div className="font-medium text-gray-900">{school.name}</div>
                  <div className="mt-0.5 text-xs text-gray-500">{school.slug}</div>
                </td>
                <td className="px-4 py-4">
                  <div className="text-sm text-gray-900">{school.ownerName}</div>
                  <div className="text-xs text-gray-500">{school.ownerEmail}</div>
                </td>
                <td className="px-4 py-4 text-sm capitalize text-gray-700">{school.plan}</td>
                <td className="px-4 py-4"><StatusBadge status={school.status} /></td>
                <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500">{new Date(school.createdAt).toLocaleDateString()}</td>
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
                        onClick={() => {
                          if (window.confirm(`Suspend ${school.name}?`)) suspendSchool.mutate(school.id);
                        }}
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
    default: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
    success: 'text-green-600 hover:bg-green-50 hover:text-green-700',
    warning: 'text-orange-600 hover:bg-orange-50 hover:text-orange-700',
    danger: 'text-red-600 hover:bg-red-50 hover:text-red-700',
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
