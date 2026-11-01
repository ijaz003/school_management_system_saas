import { Search } from 'lucide-react';
import { FilterField, FiltersPanel } from '@/components/ui/filters-panel';
import { Input } from '@/components/ui/input';
import { hasActiveFilters, resetListFilters } from '@/lib/list-filters';
import { useAvailableRoles } from '../hooks/useAvailableRoles';
import type { StaffFilters as Filters } from '../hooks/keys';

export function StaffFilters({
  value,
  onChange,
}: {
  value: Filters;
  onChange: (filters: Filters) => void;
}) {
  const rolesQuery = useAvailableRoles();

  return (
    <FiltersPanel
      description="Search staff by name, role, or status."
      pageLimit={value.limit ?? 20}
      onPageLimitChange={(limit) => onChange({ ...value, limit, page: 1 })}
      onClear={() => onChange(resetListFilters(value))}
      clearDisabled={!hasActiveFilters(value)}
    >
      <FilterField
        id="staff-search"
        label="Search"
        icon={<Search className="h-3.5 w-3.5 text-ink-400" aria-hidden="true" />}
        className="md:col-span-6"
      >
        <Input
          id="staff-search"
          type="search"
          aria-label="Search staff"
          placeholder="Search by name, email, or phone"
          value={value.search ?? ''}
          onChange={(event) =>
            onChange({ ...value, search: event.target.value || undefined, page: 1 })
          }
        />
      </FilterField>
      <FilterField id="staff-role" label="Role" className="md:col-span-3">
        <select
          id="staff-role"
          aria-label="Filter staff by role"
          className="field-select"
          value={value.role ?? ''}
          disabled={rolesQuery.isPending || Boolean(rolesQuery.error)}
          onChange={(event) =>
            onChange({ ...value, role: event.target.value || undefined, page: 1 })
          }
        >
          <option value="">All roles</option>
          {rolesQuery.data?.map((role) => (
            <option key={role.id} value={role.name}>
              {role.displayName}
            </option>
          ))}
        </select>
      </FilterField>
      <FilterField id="staff-status" label="Status" className="md:col-span-3">
        <select
          id="staff-status"
          aria-label="Filter staff by active status"
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
