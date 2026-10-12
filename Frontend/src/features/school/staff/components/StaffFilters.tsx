import { RotateCcw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
        <div className="relative md:col-span-6">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
          <Input
            type="search"
            aria-label="Search staff"
            placeholder="Search by name, email, or phone"
            className="pl-10"
            value={value.search ?? ''}
            onChange={(event) => onChange({ ...value, search: event.target.value || undefined, page: 1 })}
          />
        </div>
        <select
          aria-label="Filter staff by role"
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 md:col-span-3"
          value={value.role ?? ''}
          disabled={rolesQuery.isPending || Boolean(rolesQuery.error)}
          onChange={(event) => onChange({ ...value, role: event.target.value || undefined, page: 1 })}
        >
          <option value="">All roles</option>
          {rolesQuery.data?.map((role) => (
            <option key={role.id} value={role.name}>{role.displayName}</option>
          ))}
        </select>
        <select
          aria-label="Filter staff by active status"
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 md:col-span-2"
          value={value.isActive === undefined ? '' : String(value.isActive)}
          onChange={(event) => onChange({
            ...value,
            isActive: event.target.value === '' ? undefined : event.target.value === 'true',
            page: 1,
          })}
        >
          <option value="">All statuses</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <Button
          type="button"
          variant="outline"
          className="md:col-span-1"
          aria-label="Reset staff filters"
          title="Reset filters"
          onClick={() => onChange({ page: 1, limit: value.limit ?? 20 })}
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
