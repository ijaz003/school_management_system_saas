import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface RoleFiltersProps {
  value: string;
  onChange: (search: string) => void;
}

export function RoleFilters({ value, onChange }: RoleFiltersProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <label htmlFor="role-search" className="sr-only">Search roles</label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
        <Input
          id="role-search"
          type="search"
          placeholder="Search roles by name..."
          className="pl-10"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    </div>
  );
}
