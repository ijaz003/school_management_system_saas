export type SchoolStatus = 'trial' | 'active' | 'suspended' | 'cancelled';
export type SchoolPlan = 'basic' | 'standard' | 'premium';

export interface SchoolFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: SchoolStatus;
  plan?: SchoolPlan;
}

export const schoolKeys = {
  all: ['schools'] as const,
  lists: () => [...schoolKeys.all, 'list'] as const,
  list: (filters: SchoolFilters) => [...schoolKeys.lists(), filters] as const,
  details: () => [...schoolKeys.all, 'detail'] as const,
  detail: (id: string) => [...schoolKeys.details(), id] as const,
};
