import { Search } from 'lucide-react';
import { FilterField, FiltersPanel } from '@/components/ui/filters-panel';
import { Input } from '@/components/ui/input';
import { hasActiveFilters, resetListFilters } from '@/lib/list-filters';
import type { SchoolFilters as Filters, SchoolPlan, SchoolStatus } from '../hooks/keys';

export function SchoolFilters({
  value,
  onChange,
}: {
  value: Filters;
  onChange: (filters: Filters) => void;
}) {
  return (
    <FiltersPanel
      description="Search schools by name, owner, status, or plan."
      pageLimit={value.limit ?? 20}
      onPageLimitChange={(limit) => onChange({ ...value, limit, page: 1 })}
      onClear={() => onChange(resetListFilters(value))}
      clearDisabled={!hasActiveFilters(value)}
    >
      <FilterField
        id="school-search"
        label="Search"
        icon={<Search className="h-3.5 w-3.5 text-ink-400" aria-hidden="true" />}
        className="md:col-span-6"
      >
        <Input
          id="school-search"
          type="search"
          aria-label="Search schools"
          placeholder="Search by name, slug, or owner email"
          value={value.search ?? ''}
          onChange={(event) =>
            onChange({ ...value, search: event.target.value || undefined, page: 1 })
          }
        />
      </FilterField>
      <FilterField id="school-status" label="Status" className="md:col-span-3">
        <select
          id="school-status"
          aria-label="Filter by status"
          className="field-select"
          value={value.status ?? ''}
          onChange={(event) =>
            onChange({
              ...value,
              status: (event.target.value || undefined) as SchoolStatus | undefined,
              page: 1,
            })
          }
        >
          <option value="">All statuses</option>
          <option value="trial">Trial</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </FilterField>
      <FilterField id="school-plan" label="Plan" className="md:col-span-3">
        <select
          id="school-plan"
          aria-label="Filter by plan"
          className="field-select"
          value={value.plan ?? ''}
          onChange={(event) =>
            onChange({
              ...value,
              plan: (event.target.value || undefined) as SchoolPlan | undefined,
              page: 1,
            })
          }
        >
          <option value="">All plans</option>
          <option value="basic">Basic</option>
          <option value="standard">Standard</option>
          <option value="premium">Premium</option>
        </select>
      </FilterField>
    </FiltersPanel>
  );
}