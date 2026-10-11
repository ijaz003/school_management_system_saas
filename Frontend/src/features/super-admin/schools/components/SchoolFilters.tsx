import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { SchoolFilters as Filters, SchoolPlan, SchoolStatus } from '../hooks/keys';

export function SchoolFilters({
  value,
  onChange,
}: {
  value: Filters;
  onChange: (filters: Filters) => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
        <Input
          type="search"
          aria-label="Search schools"
          placeholder="Search by name, slug, or owner email"
          className="pl-10"
          value={value.search ?? ''}
          onChange={(event) => onChange({ ...value, search: event.target.value || undefined, page: 1 })}
        />
      </div>
      <select
        aria-label="Filter by status"
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={value.status ?? ''}
        onChange={(event) => onChange({ ...value, status: (event.target.value || undefined) as SchoolStatus | undefined, page: 1 })}
      >
        <option value="">All statuses</option>
        <option value="trial">Trial</option>
        <option value="active">Active</option>
        <option value="suspended">Suspended</option>
        <option value="cancelled">Cancelled</option>
      </select>
      <select
        aria-label="Filter by plan"
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={value.plan ?? ''}
        onChange={(event) => onChange({ ...value, plan: (event.target.value || undefined) as SchoolPlan | undefined, page: 1 })}
      >
        <option value="">All plans</option>
        <option value="basic">Basic</option>
        <option value="standard">Standard</option>
        <option value="premium">Premium</option>
      </select>
    </div>
  );
}
