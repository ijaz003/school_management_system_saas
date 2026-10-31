import { Eye, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { StudentListItem } from '../hooks/useStudents';

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-ink-100 text-ink-800',
  transferred: 'bg-amber-100 text-amber-800',
  alumni: 'bg-primary-100 text-primary-800',
};

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
          <thead className="border-b border-ink-100 bg-surface/80 text-xs uppercase tracking-wide text-ink-700/70">
            <tr>
              <th className="px-5 py-3 font-semibold">Student</th>
              <th className="px-5 py-3 font-semibold">Admission</th>
              <th className="px-5 py-3 font-semibold">Class</th>
              <th className="px-5 py-3 font-semibold">Guardian</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {items.map((student) => (
              <tr key={student.id} className="hover:bg-surface/60">
                <td className="px-5 py-4">
                  <button
                    type="button"
                    className="text-left"
                    onClick={() => onView(student)}
                  >
                    <span className="block font-semibold text-ink-950">{student.fullName}</span>
                    <span className="block text-xs capitalize text-ink-700/65">{student.gender}</span>
                  </button>
                </td>
                <td className="px-5 py-4 font-mono text-xs text-ink-800">{student.admissionNo}</td>
                <td className="px-5 py-4 text-ink-800">
                  {student.className}
                  <span className="text-ink-700/50"> · </span>
                  {student.sectionName}
                </td>
                <td className="px-5 py-4">
                  <span className="block text-ink-900">{student.guardianName}</span>
                  <span className="block text-xs text-ink-700/65">{student.guardianPhone}</span>
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                      STATUS_STYLES[student.status] ?? STATUS_STYLES.inactive
                    }`}
                  >
                    {student.status}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex justify-end gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label={`View ${student.fullName}`}
                      onClick={() => onView(student)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {canUpdate && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        aria-label={`Edit ${student.fullName}`}
                        onClick={() => onEdit(student)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        aria-label={`Delete ${student.fullName}`}
                        onClick={() => onDelete(student)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
