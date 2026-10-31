export const classKeys = {
  all: ['classes'] as const,
  lists: () => [...classKeys.all, 'list'] as const,
  list: (search?: string) => [...classKeys.lists(), { search }] as const,
  details: () => [...classKeys.all, 'detail'] as const,
  detail: (id: string) => [...classKeys.details(), id] as const,
  sections: (id: string) => [...classKeys.all, 'sections', id] as const,
};
