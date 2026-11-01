import { useQuery } from '@tanstack/react-query';
import { api, buildQueryString } from '@/lib/api';
import { parentKeys, type ParentFilters } from './keys';

export interface LinkedChild {
  id: string;
  fullName: string;
  admissionNo: string;
  classId: string;
  sectionId: string;
  className: string;
  sectionName: string;
  status: string;
  linkedAt: string;
}

export interface ParentRecord {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  children: LinkedChild[];
  childrenCount: number;
}

export interface ParentsListResponse {
  items: ParentRecord[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export function useParents(filters: ParentFilters = {}) {
  return useQuery({
    queryKey: parentKeys.list(filters),
    queryFn: async () => {
      const response = await api.get<ParentsListResponse>(
        `/school/parents${buildQueryString(filters)}`,
      );
      if (!response.data) throw new Error('The server returned no parent list');
      return response.data;
    },
    staleTime: 30_000,
  });
}

export function useParent(id: string | null) {
  return useQuery({
    queryKey: parentKeys.detail(id ?? ''),
    queryFn: async () => {
      const response = await api.get<ParentRecord>(`/school/parents/${id}`);
      if (!response.data) throw new Error('The server returned no parent');
      return response.data;
    },
    enabled: Boolean(id),
  });
}
