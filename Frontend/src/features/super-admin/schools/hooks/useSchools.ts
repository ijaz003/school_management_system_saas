import { useQuery } from '@tanstack/react-query';
import { api, buildQueryString } from '@/lib/api';
import { schoolKeys, type SchoolFilters, type SchoolPlan, type SchoolStatus } from './keys';

export interface School {
  id: string;
  name: string;
  slug: string;
  customDomain: string | null;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  city: string | null;
  address: string | null;
  plan: SchoolPlan;
  status: SchoolStatus;
  maxStudents: number;
  maxTeachers: number;
  maxSmsPerMonth: number;
  maxCustomRoles: number;
  createdAt: string;
  trialEndsAt: string | null;
  subscriptionEndsAt: string | null;
  deletedAt: string | null;
}

export interface SchoolsListResponse {
  items: School[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function useSchools(filters: SchoolFilters = {}) {
  return useQuery({
    queryKey: schoolKeys.list(filters),
    queryFn: async () => {
      const response = await api.get<SchoolsListResponse>(
        `/super-admin/schools${buildQueryString(filters)}`,
      );
      if (!response.data) throw new Error('The server returned no school list');
      return response.data;
    },
  });
}
