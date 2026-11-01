import { Search } from 'lucide-react';
import { FilterField, FiltersPanel } from '@/components/ui/filters-panel';
import { Input } from '@/components/ui/input';
import { hasActiveFilters, resetListFilters } from '@/lib/list-filters';
import type { ParentFilters as Filters } from '../hooks/keys';

export function ParentFilters({
  value,
  onChange,
}: {
  value: Filters;
  onChange: (filters: Filters) => void;
}) {
  return (
    <FiltersPanel
      description="Search parents by name, email, phone, or status."
      pageLimit={value.limit ?? 20}
      onPageLimitChange={(limit) => onChange({ ...value, limit, page: 1 })}
      onClear={() => onChange(resetListFilters(value))}
      clearDisabled={!hasActiveFilters(value)}
    >
      <FilterField
        id="parent-search"
        label="Search"
        icon={<Search className="h-3.5 w-3.5 text-ink-400" aria-hidden="true" />}
        className="md:col-span-8"
      >
        <Input
          id="parent-search"
          type="search"
          aria-label="Search parents"
          placeholder="Search by name, email, or phone"
          value={value.search ?? ''}
          onChange={(event) =>
            onChange({ ...value, search: event.target.value || undefined, page: 1 })
          }
        />
      </FilterField>
      <FilterField id="parent-status" label="Status" className="md:col-span-4">
        <select
          id="parent-status"
          aria-label="Filter parents by active status"
          className="field-select"
          value={value.isActive === undefined ? '' : String(value.isActive)}
          onChange={(event) =>
            onChange({
              ...value,
              isActive: event.target.value === '' ? undefined : event.target.value === 'true',
              page: 1,
            })
          }
        >
          <option value="">All statuses</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </FilterField>
    </FiltersPanel>
  );
}
