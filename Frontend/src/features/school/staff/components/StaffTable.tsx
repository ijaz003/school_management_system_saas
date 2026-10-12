import { Eye, KeyRound, Pencil, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import type { StaffMember } from '../hooks/useStaff';

interface StaffTableProps {
  staff: StaffMember[];
  onEdit: (staff: StaffMember) => void;
  onDelete: (staff: StaffMember) => void;
  onResetPassword: (staff: StaffMember) => void;
  busy?: boolean;
}

const roleColors: Record<string, string> = {
  teacher: 'bg-orange-100 text-orange-700',
  accountant: 'bg-green-100 text-green-700',
  principal: 'bg-cyan-100 text-cyan-700',
  exam_coordinator: 'bg-purple-100 text-purple-700',
  fee_manager: 'bg-blue-100 text-blue-700',
};

function initials(name: string) {
  return name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase();
}

export function StaffTable({ staff, onEdit, onDelete, onResetPassword, busy = false }: StaffTableProps) {
  const navigate = useNavigate();

  if (staff.length === 0) {
    return (
      <div className="p-12 text-center">
        <div className="mb-3 text-4xl" aria-hidden="true">👥</div>
        <h2 className="font-semibold text-gray-900">No staff members found</h2>
        <p className="mt-1 text-sm text-gray-500">Try changing your search or filters.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="border-b border-gray-200 bg-gray-50">
          <tr>
            {['Staff member', 'Role', 'Phone', 'Status', 'Joined', 'Actions'].map((label) => (
              <th key={label} scope="col" className="whitespace-nowrap px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {staff.map((member) => (
            <tr key={member.id} className="transition-colors hover:bg-gray-50">
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-semibold text-white">
                    {initials(member.fullName)}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-gray-900">{member.fullName}</div>
                    <div className="truncate text-xs text-gray-500">{member.email}</div>
                  </div>
                </div>
              </td>
              <td className="px-5 py-4">
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${roleColors[member.role] ?? 'bg-gray-100 text-gray-700'}`}>
                  {member.role.split('_').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </span>
              </td>
              <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">{member.phone || '—'}</td>
              <td className="px-5 py-4">
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${member.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {member.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-500">
                {new Date(member.createdAt).toLocaleDateString()}
              </td>
              <td className="px-5 py-4">
                <div className="flex items-center justify-end gap-1">
                  <Button type="button" variant="ghost" size="sm" aria-label={`View ${member.fullName}`} title="View" onClick={() => navigate(`/settings/staff/${member.id}`)}>
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button type="button" variant="ghost" size="sm" aria-label={`Edit ${member.fullName}`} title="Edit" onClick={() => onEdit(member)}>
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button type="button" variant="ghost" size="sm" className="text-orange-600 hover:bg-orange-50" aria-label={`Reset password for ${member.fullName}`} title="Reset password" disabled={busy} onClick={() => onResetPassword(member)}>
                    <KeyRound className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button type="button" variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" aria-label={`Delete ${member.fullName}`} title="Delete" disabled={busy} onClick={() => onDelete(member)}>
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
