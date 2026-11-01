/** Keys that are pagination-only and should not count as "active filters". */
const PAGINATION_KEYS = new Set(['page', 'limit']);

export function hasActiveFilters(
  filters: object,
  ignoreKeys: string[] = [],
): boolean {
  const ignored = new Set([...PAGINATION_KEYS, ...ignoreKeys]);
  return Object.entries(filters).some(([key, value]) => {
    if (ignored.has(key)) return false;
    if (value === undefined || value === null || value === '') return false;
    if (Array.isArray(value) && value.length === 0) return false;
    return true;
  });
}

export function resetListFilters<T extends { page?: number; limit?: number }>(
  current: T,
  defaults: Partial<T> = {},
): T {
  return {
    ...defaults,
    page: 1,
    limit: current.limit ?? 20,
  } as T;
}
