import { Eye, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
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
              <tr
                key={student.id}
                className="group transition hover:bg-primary-50/30"
              >
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
                  <div className="flex justify-end">
                    <RowActions
                      student={student}
                      canUpdate={canUpdate}
                      canDelete={canDelete}
                      onView={onView}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
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

function RowActions({
  student,
  canUpdate,
  canDelete,
  onView,
  onEdit,
  onDelete,
}: {
  student: StudentListItem;
  canUpdate: boolean;
  canDelete: boolean;
  onView: (student: StudentListItem) => void;
  onEdit: (student: StudentListItem) => void;
  onDelete: (student: StudentListItem) => void;
}) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label={`Actions for ${student.fullName}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        className="rounded-lg p-2 text-ink-500 transition hover:bg-ink-100 hover:text-ink-900"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 z-20 mt-1 w-44 rounded-xl border border-ink-200 bg-surface py-1 shadow-[var(--shadow-lift)]"
        >
          <MenuItem
            icon={Eye}
            label="View details"
            onClick={() => {
              setOpen(false);
              onView(student);
            }}
          />
          {canUpdate && (
            <MenuItem
              icon={Pencil}
              label="Edit"
              onClick={() => {
                setOpen(false);
                onEdit(student);
              }}
            />
          )}
          {canDelete && (
            <MenuItem
              icon={Trash2}
              label="Delete"
              danger
              onClick={() => {
                setOpen(false);
                onDelete(student);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: typeof Eye;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`flex w-full items-center gap-2 px-3 py-2 text-sm ${
        danger ? 'text-danger-600 hover:bg-danger-50' : 'text-ink-700 hover:bg-ink-50'
      }`}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {label}
    </button>
  );
}
