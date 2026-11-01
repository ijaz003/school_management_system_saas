import { useMemo, useState } from 'react';
import { GraduationCap, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useStudents } from '@/features/school/students/hooks/useStudents';

const PICKER_FILTERS = { limit: 100 } as const;

export function StudentPicker({
  value,
  onChange,
  excludeIds = [],
  disabled,
}: {
  value: string[];
  onChange: (ids: string[]) => void;
  excludeIds?: string[];
  disabled?: boolean;
}) {
  const [search, setSearch] = useState('');
  const studentsQuery = useStudents(PICKER_FILTERS);
  const excluded = useMemo(() => new Set(excludeIds), [excludeIds]);

  const options = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return (studentsQuery.data?.items ?? []).filter((student) => {
      if (excluded.has(student.id)) return false;
      if (!needle) return true;
      return `${student.fullName} ${student.admissionNo} ${student.className} ${student.sectionName}`
        .toLowerCase()
        .includes(needle);
    });
  }, [studentsQuery.data, excluded, search]);

  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter((item) => item !== id) : [...value, id]);

  return (
    <section className="rounded-xl border border-ink-200">
      <div className="border-b border-ink-200 p-3">
        <label htmlFor="parent-student-search" className="sr-only">
          Search students
        </label>
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
            aria-hidden="true"
          />
          <Input
            id="parent-student-search"
            className="pl-10"
            placeholder="Search students by name, admission no, class…"
            value={search}
            disabled={disabled}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        {studentsQuery.error && (
          <p className="mt-2 text-sm text-danger-600">
            Could not load students: {studentsQuery.error.message}
          </p>
        )}
      </div>

      {studentsQuery.isPending ? (
        <p className="p-5 text-sm text-ink-500">Loading students…</p>
      ) : options.length === 0 ? (
        <p className="p-5 text-sm text-ink-500">
          {search ? 'No students match your search.' : 'No students available to link.'}
        </p>
      ) : (
        <div className="grid max-h-56 gap-2 overflow-y-auto p-3 sm:grid-cols-2">
          {options.map((student) => {
            const checked = value.includes(student.id);
            return (
              <label
                key={student.id}
                className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 ${
                  checked ? 'border-primary-200 bg-primary-50' : 'border-ink-100 hover:bg-ink-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => toggle(student.id)}
                  className="h-4 w-4 rounded border-ink-300 text-primary-700 focus:ring-primary-500"
                />
                <GraduationCap className="h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-ink-800">
                    {student.fullName}
                  </span>
                  <span className="block truncate text-xs text-ink-500">
                    {student.admissionNo} · {student.className} {student.sectionName}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      )}
      <p className="border-t border-ink-100 px-3 py-2 text-xs text-ink-500">
        {value.length} student(s) selected
        {studentsQuery.data && studentsQuery.data.pagination.total > 100
          ? ' · showing the first 100 students'
          : ''}
      </p>
    </section>
  );
}
