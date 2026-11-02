import { Badge } from '@/components/ui/badge';
import { RowActions } from '@/components/ui/row-actions';
import type { StudentListItem } from '../hooks/useStudents';

const STATUS_TONE = {
  active: 'success',
  inactive: 'neutral',
  transferred: 'warning',
  alumni: 'primary',
} as const;

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export function StudentTable({
  items,
  canUpdate,
  canDelete,
  onView,
  onEdit,
  onDelete,
}: {
  items: StudentListItem[];
  canUpdate: boolean;
  canDelete: boolean;
  onView: (student: StudentListItem) => void;
  onEdit: (student: StudentListItem) => void;
  onDelete: (student: StudentListItem) => void;
}) {
  return (
    <div className="panel overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="sticky top-0 z-10 border-b border-ink-100 bg-surface-muted/90 text-xs uppercase tracking-wide text-ink-500 backdrop-blur">
            <tr>
              <th className="px-5 py-3.5 font-semibold">Student</th>
              <th className="px-5 py-3.5 font-semibold">Admission</th>
              <th className="px-5 py-3.5 font-semibold">Class</th>
              <th className="px-5 py-3.5 font-semibold">Guardian</th>
              <th className="px-5 py-3.5 font-semibold">Status</th>
              <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {items.map((student) => (
              <tr key={student.id} className="group transition hover:bg-primary-50/30">
                <td className="px-5 py-3.5">
                  <button
                    type="button"
                    className="flex items-center gap-3 text-left"
                    onClick={() => onView(student)}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink-100 text-xs font-semibold text-ink-700">
                      {initials(student.fullName)}
                    </span>
                    <span>
                      <span className="block font-semibold text-ink-950 group-hover:text-primary-800">
                        {student.fullName}
                      </span>
                      <span className="block text-xs capitalize text-ink-500">
                        {student.gender}
                      </span>
                    </span>
                  </button>
                </td>
                <td className="px-5 py-3.5 font-mono text-xs text-ink-700">
                  {student.admissionNo}
                </td>
                <td className="px-5 py-3.5 text-ink-700">
                  {student.className}
                  <span className="text-ink-300"> · </span>
                  {student.sectionName}
                </td>
                <td className="px-5 py-3.5">
                  <span className="block text-ink-900">{student.guardianName}</span>
                  <span className="block text-xs text-ink-500">{student.guardianPhone}</span>
                </td>
                <td className="px-5 py-3.5">
                  <Badge tone={STATUS_TONE[student.status] ?? 'neutral'}>
                    {student.status}
                  </Badge>
                </td>
                <td className="px-5 py-3.5">
                  <RowActions
                    onPreview={() => onView(student)}
                    onEdit={canUpdate ? () => onEdit(student) : undefined}
                    onDelete={canDelete ? () => onDelete(student) : undefined}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
