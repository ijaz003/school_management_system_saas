import { useMemo, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAvailablePermissions, type PermissionGroup } from '../hooks/useAvailablePermissions';

interface PermissionPickerProps {
  value: string[];
  onChange: (permissions: string[]) => void;
  disabled?: boolean;
}

export function PermissionPicker({ value, onChange, disabled }: PermissionPickerProps) {
  const permissionsQuery = useAvailablePermissions();
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const groups = permissionsQuery.data?.grouped;

  const filtered = useMemo<Record<string, PermissionGroup>>(() => {
    if (!groups) return {};
    const term = search.trim().toLocaleLowerCase();
    if (!term) return groups;

    const result: Record<string, PermissionGroup> = {};
    for (const [key, group] of Object.entries(groups)) {
      const matches = group.permissions.filter((permission) =>
        `${permission.key} ${permission.displayName} ${permission.description ?? ''}`
          .toLocaleLowerCase()
          .includes(term),
      );
      if (matches.length > 0) result[key] = { ...group, permissions: matches };
    }
    return result;
  }, [groups, search]);

  const allKeys = Object.values(groups ?? {}).flatMap((group) =>
    group.permissions.map((permission) => permission.key),
  );

  const togglePermission = (key: string) => {
    onChange(value.includes(key) ? value.filter((permission) => permission !== key) : [...value, key]);
  };

  const toggleModule = (module: string) => {
    const keys = groups?.[module]?.permissions.map((permission) => permission.key) ?? [];
    const selected = new Set(value);
    if (keys.every((key) => selected.has(key))) {
      keys.forEach((key) => selected.delete(key));
    } else {
      keys.forEach((key) => selected.add(key));
    }
    onChange([...selected]);
  };

  if (permissionsQuery.isPending) {
    return <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">Loading permissions...</div>;
  }

  if (permissionsQuery.error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Could not load permissions: {permissionsQuery.error.message}
        <Button type="button" variant="outline" size="sm" className="ml-3" onClick={() => void permissionsQuery.refetch()} isLoading={permissionsQuery.isFetching}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-gray-50 p-4">
        <div>
          <p className="text-2xl font-bold text-blue-700">{value.length}</p>
          <p className="text-xs text-gray-500">permissions selected</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => onChange(allKeys)} disabled={disabled || allKeys.length === 0}>
            <Check className="h-4 w-4" aria-hidden="true" /> Select all
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => onChange([])} disabled={disabled || value.length === 0}>
            Clear
          </Button>
        </div>
      </header>
      <div className="border-b border-gray-200 p-3">
        <label htmlFor="permission-search" className="sr-only">Search permissions</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
          <Input id="permission-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search permissions..." className="pl-10" disabled={disabled} />
        </div>
      </div>
      <div className="max-h-[500px] overflow-y-auto">
        {Object.keys(filtered).length === 0 ? (
          <p className="p-8 text-center text-sm text-gray-500">No permissions match your search.</p>
        ) : Object.entries(filtered).map(([key, group]) => {
          const selectedCount = group.permissions.filter((permission) => value.includes(permission.key)).length;
          const modulePermissions = groups?.[key]?.permissions ?? [];
          const moduleSelectedCount = modulePermissions.filter((permission) => value.includes(permission.key)).length;
          const isCollapsed = collapsed[key] ?? false;
          const allSelected = modulePermissions.length > 0 && moduleSelectedCount === modulePermissions.length;

          return (
            <section key={key} className="border-b border-gray-100 last:border-b-0">
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <button
                  type="button"
                  className="inline-flex min-w-0 items-center gap-2 text-left text-sm font-semibold text-gray-900"
                  aria-expanded={!isCollapsed}
                  onClick={() => setCollapsed((current) => ({ ...current, [key]: !isCollapsed }))}
                >
                  <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} aria-hidden="true" />
                  {group.displayName}
                </button>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">{selectedCount}/{group.permissions.length}</span>
                  <Button type="button" variant="outline" size="sm" onClick={() => toggleModule(key)} disabled={disabled}>
                    {allSelected ? 'Deselect module' : 'Select module'}
                  </Button>
                </div>
              </div>
              {!isCollapsed && (
                <div className="grid gap-2 px-4 pb-4 sm:grid-cols-2">
                  {group.permissions.map((permission) => (
                    <label key={permission.id} className={`flex cursor-pointer items-start gap-2 rounded-lg border p-3 ${value.includes(permission.key) ? 'border-blue-200 bg-blue-50' : 'border-gray-100 hover:bg-gray-50'}`}>
                      <input
                        type="checkbox"
                        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={value.includes(permission.key)}
                        disabled={disabled}
                        onChange={() => togglePermission(permission.key)}
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-gray-800">{permission.displayName}</span>
                        <span className="block break-all font-mono text-xs text-gray-500">{permission.key}</span>
                        {permission.description && <span className="mt-1 block text-xs text-gray-500">{permission.description}</span>}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </section>
  );
}
