import { useQuery } from '@tanstack/react-query';
import { api, buildQueryString } from '@/lib/api';
import { staffKeys, type StaffFilters } from './keys';

export interface StaffMember {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: string;
  roleId: string | null;
  permissions: string[];
  isActive: boolean;
  avatarUrl: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  metadata: { subject?: string; joiningDate?: string } | null;
}

export interface StaffListResponse {
  items: StaffMember[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export function useStaff(filters: StaffFilters = {}) {
  return useQuery({
    queryKey: staffKeys.list(filters),
    queryFn: async () => {
      const response = await api.get<StaffListResponse>(
        `/school/staff${buildQueryString(filters)}`,
      );
      if (!response.data) throw new Error('The server returned no staff list');
      return response.data;
    },
    staleTime: 30_000,
  });
}
