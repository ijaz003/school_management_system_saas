import { useQuery } from '@tanstack/react-query';
import { api, buildQueryString } from '@/lib/api';
import { teacherKeys, type TeacherFilters } from './keys';

export interface TeacherListItem {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  avatarUrl: string | null;
  subject: string | null;
  createdAt: string;
  assignmentCount: number;
  classTeacherCount: number;
}

export interface TeachersListResponse {
  items: TeacherListItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export function useTeachers(
  filters: TeacherFilters = {},
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: teacherKeys.list(filters),
    queryFn: async () => {
      const response = await api.get<TeachersListResponse>(
        `/school/teachers${buildQueryString(filters)}`,
      );
      if (!response.data) throw new Error('The server returned no teacher list');
      return response.data;
    },
    staleTime: 30_000,
    enabled: options.enabled ?? true,
  });
}
