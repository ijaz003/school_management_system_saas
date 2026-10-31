import { RotateCcw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useClasses } from '@/features/school/classes/hooks/useClasses';
import { useSections } from '@/features/school/classes/hooks/useSections';
import type { StudentFilters as Filters, StudentStatus } from '../hooks/keys';

const STATUSES: { value: StudentStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'transferred', label: 'Transferred' },
  { value: 'alumni', label: 'Alumni' },
];

export function StudentFilters({
  value,
  onChange,
}: {
  value: Filters;
  onChange: (filters: Filters) => void;
}) {
  const classesQuery = useClasses();
  const sectionsQuery = useSections(value.classId ?? '');

  return (
    <div className="panel p-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
        <div className="relative md:col-span-4">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-700/45"
            aria-hidden="true"
          />
          <Input
            type="search"
            aria-label="Search students"
            placeholder="Search name, admission no, guardian..."
            className="pl-10"
            value={value.search ?? ''}
            onChange={(event) =>
              onChange({ ...value, search: event.target.value || undefined, page: 1 })
            }
          />
        </div>

        <select
          aria-label="Filter by class"
          className="rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 md:col-span-2"
          value={value.classId ?? ''}
          onChange={(event) =>
            onChange({
              ...value,
              classId: event.target.value || undefined,
              sectionId: undefined,
              page: 1,
            })
          }
        >
          <option value="">All classes</option>
          {classesQuery.data?.map((cls) => (
            <option key={cls.id} value={cls.id}>
              {cls.name}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter by section"
          className="rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 md:col-span-2"
          value={value.sectionId ?? ''}
          disabled={!value.classId || sectionsQuery.isPending}
          onChange={(event) =>
            onChange({ ...value, sectionId: event.target.value || undefined, page: 1 })
          }
        >
          <option value="">All sections</option>
          {sectionsQuery.data?.map((section) => (
            <option key={section.id} value={section.id}>
              {section.name}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter by status"
          className="rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 md:col-span-3"
          value={value.status ?? ''}
          onChange={(event) =>
            onChange({
              ...value,
              status: (event.target.value || undefined) as StudentStatus | undefined,
              page: 1,
            })
          }
        >
          <option value="">All statuses</option>
          {STATUSES.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>

        <Button
          type="button"
          variant="outline"
          className="md:col-span-1"
          aria-label="Reset student filters"
          title="Reset filters"
          onClick={() => onChange({ page: 1, limit: value.limit ?? 20 })}
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
