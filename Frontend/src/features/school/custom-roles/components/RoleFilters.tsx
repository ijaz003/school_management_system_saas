import { Search } from 'lucide-react';
import { FilterField, FiltersPanel } from '@/components/ui/filters-panel';
import { Input } from '@/components/ui/input';
import { hasActiveFilters } from '@/lib/list-filters';

interface RoleFiltersProps {
  value: string;
  onChange: (search: string) => void;
}

export function RoleFilters({ value, onChange }: RoleFiltersProps) {
  return (
    <FiltersPanel
      description="Find roles by name or description."
      onClear={() => onChange('')}
      clearDisabled={!hasActiveFilters({ search: value })}
    >
      <FilterField
        id="role-search"
        label="Search"
        icon={<Search className="h-3.5 w-3.5 text-ink-400" aria-hidden />}
        className="md:col-span-6"
      >
        <Input
          id="role-search"
          type="search"
          aria-label="Search roles"
          placeholder="Search roles by name..."
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </FilterField>
    </FiltersPanel>
  );
}
