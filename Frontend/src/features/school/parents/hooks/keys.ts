export interface ParentFilters {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export const parentKeys = {
  all: ['parents'] as const,
  lists: () => [...parentKeys.all, 'list'] as const,
  list: (filters: ParentFilters) => [...parentKeys.lists(), filters] as const,
  details: () => [...parentKeys.all, 'detail'] as const,
  detail: (id: string) => [...parentKeys.details(), id] as const,
};
