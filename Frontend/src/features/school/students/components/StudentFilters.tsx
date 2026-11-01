import { Search, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { FilterField, FiltersPanel } from '@/components/ui/filters-panel';
import { Input } from '@/components/ui/input';
import { hasActiveFilters, resetListFilters } from '@/lib/list-filters';
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
    <div className="space-y-3">
      <FiltersPanel
        description="Search by name, class, section, or status."
        pageLimit={value.limit ?? 20}
        onPageLimitChange={(limit) => onChange({ ...value, limit, page: 1 })}
        onClear={() => onChange(resetListFilters(value))}
        clearDisabled={!hasActiveFilters(value)}
      >
        <FilterField
          id="student-search"
          label="Search"
          icon={<Search className="h-3.5 w-3.5 text-ink-400" aria-hidden="true" />}
          className="md:col-span-6"
        >
          <Input
            id="student-search"
            type="search"
            aria-label="Search students"
            placeholder="Search name, admission no, guardian…"
            value={value.search ?? ''}
            onChange={(event) =>
              onChange({ ...value, search: event.target.value || undefined, page: 1 })
            }
          />
        </FilterField>

        <FilterField id="student-class" label="Class" className="md:col-span-2">
          <select
            id="student-class"
            aria-label="Filter by class"
            className="field-select"
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
        </FilterField>

        <FilterField id="student-section" label="Section" className="md:col-span-2">
          <select
            id="student-section"
            aria-label="Filter by section"
            className="field-select"
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
        </FilterField>

        <FilterField id="student-status" label="Status" className="md:col-span-2">
          <select
            id="student-status"
            aria-label="Filter by status"
            className="field-select"
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
        </FilterField>
      </FiltersPanel>

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
        </div>
      )}
    </div>
  );
}