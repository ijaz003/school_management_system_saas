import { RotateCcw, Search, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
  const selectedClass = classesQuery.data?.find((item) => item.id === value.classId);
  const selectedSection = sectionsQuery.data?.find((item) => item.id === value.sectionId);
  const selectedStatus = STATUSES.find((item) => item.value === value.status);

  const chips = [
    value.search && { key: 'search', label: `Search: ${value.search}` },
    selectedClass && { key: 'classId', label: `Class: ${selectedClass.name}` },
    selectedSection && { key: 'sectionId', label: `Section: ${selectedSection.name}` },
    selectedStatus && { key: 'status', label: `Status: ${selectedStatus.label}` },
  ].filter(Boolean) as Array<{ key: string; label: string }>;

  const clearChip = (key: string) => {
    if (key === 'search') onChange({ ...value, search: undefined, page: 1 });
    if (key === 'classId')
      onChange({ ...value, classId: undefined, sectionId: undefined, page: 1 });
    if (key === 'sectionId') onChange({ ...value, sectionId: undefined, page: 1 });
    if (key === 'status') onChange({ ...value, status: undefined, page: 1 });
  };

  return (
    <div className="panel space-y-3 p-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
        <div className="relative md:col-span-4">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
            aria-hidden="true"
          />
          <Input
            type="search"
            aria-label="Search students"
            placeholder="Search name, admission no, guardian…"
            className="pl-10"
            value={value.search ?? ''}
            onChange={(event) =>
              onChange({ ...value, search: event.target.value || undefined, page: 1 })
            }
          />
        </div>

        <select
          aria-label="Filter by class"
          className="field-select md:col-span-2"
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
          className="field-select md:col-span-2"
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
          className="field-select md:col-span-2"
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

        <select
          aria-label="Rows per page"
          className="field-select md:col-span-1"
          value={value.limit ?? 20}
          onChange={(event) =>
            onChange({ ...value, limit: Number(event.target.value), page: 1 })
          }
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
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

      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-ink-500">Active filters</span>
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => clearChip(chip.key)}
              className="inline-flex items-center gap-1"
            >
              <Badge tone="primary" className="gap-1 pr-1.5">
                {chip.label}
                <X className="h-3 w-3" aria-hidden="true" />
              </Badge>
            </button>
          ))}
          <button
            type="button"
            className="text-xs font-semibold text-ink-500 hover:text-ink-800"
            onClick={() => onChange({ page: 1, limit: value.limit ?? 20 })}
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
