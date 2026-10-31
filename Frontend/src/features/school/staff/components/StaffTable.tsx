import { Eye, KeyRound, Pencil, Trash2, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import type { StaffMember } from '../hooks/useStaff';

interface StaffTableProps {
  staff: StaffMember[];
  onEdit: (staff: StaffMember) => void;
  onDelete: (staff: StaffMember) => void;
  onResetPassword: (staff: StaffMember) => void;
  busy?: boolean;
}

type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';

const roleTones: Record<string, Tone> = {
  teacher: 'warning',
  accountant: 'success',
  principal: 'primary',
  exam_coordinator: 'neutral',
  fee_manager: 'primary',
};

function initials(name: string) {
  return name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase();
}

export function StaffTable({ staff, onEdit, onDelete, onResetPassword, busy = false }: StaffTableProps) {
  const navigate = useNavigate();

  if (staff.length === 0) {
    return (
      <div className="p-4 sm:p-6">
        <EmptyState
          icon={Users}
          title="No staff members found"
          description="Try changing your search or filters."
        />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left">
        <thead className="sticky top-0 border-b border-ink-100 bg-ink-50">
          <tr>
            {['Staff member', 'Role', 'Phone', 'Status', 'Joined', 'Actions'].map((label) => (
              <th
                key={label}
                scope="col"
                className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-500 sm:px-5"
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100">
          {staff.map((member) => (
            <tr key={member.id} className="transition-colors hover:bg-ink-50">
              <td className="px-4 py-4 sm:px-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-700 text-sm font-semibold text-white">
                    {initials(member.fullName)}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-ink-950">{member.fullName}</div>
                    <div className="truncate text-xs text-ink-500">{member.email}</div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-4 sm:px-5">
                <Badge tone={roleTones[member.role] ?? 'neutral'} className="whitespace-nowrap">
                  {member.role.split('_').join(' ')}
                </Badge>
              </td>
              <td className="whitespace-nowrap px-4 py-4 text-sm text-ink-600 sm:px-5">
                {member.phone || '—'}
              </td>
              <td className="px-4 py-4 sm:px-5">
                <Badge tone={member.isActive ? 'success' : 'neutral'}>
                  {member.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </td>
              <td className="whitespace-nowrap px-4 py-4 text-sm text-ink-500 sm:px-5">
                {new Date(member.createdAt).toLocaleDateString()}
              </td>
              <td className="px-4 py-4 sm:px-5">
                <div className="flex items-center justify-end gap-1">
                  <Button type="button" variant="ghost" size="sm" aria-label={`View ${member.fullName}`} title="View" onClick={() => navigate(`/settings/staff/${member.id}`)}>
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button type="button" variant="ghost" size="sm" aria-label={`Edit ${member.fullName}`} title="Edit" onClick={() => onEdit(member)}>
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button type="button" variant="ghost" size="sm" className="text-warning-700 hover:bg-warning-50" aria-label={`Reset password for ${member.fullName}`} title="Reset password" disabled={busy} onClick={() => onResetPassword(member)}>
                    <KeyRound className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button type="button" variant="ghost" size="sm" className="text-danger-600 hover:bg-danger-50" aria-label={`Delete ${member.fullName}`} title="Delete" disabled={busy} onClick={() => onDelete(member)}>
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
