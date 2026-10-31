import { useQuery } from '@tanstack/react-query';
import { api, buildQueryString } from '@/lib/api';
import { studentKeys, type StudentFilters, type StudentStatus } from './keys';

export interface StudentListItem {
  id: string;
  admissionNo: string;
  fullName: string;
  gender: string;
  dateOfBirth: string;
  phone: string | null;
  email: string | null;
  classId: string;
  sectionId: string;
  className: string;
  sectionName: string;
  guardianName: string;
  guardianPhone: string;
  status: StudentStatus;
  admissionDate: string;
  createdAt: string;
}

export interface StudentsListResponse {
  items: StudentListItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export function useStudents(
  filters: StudentFilters = {},
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: studentKeys.list(filters),
    queryFn: async () => {
      const response = await api.get<StudentsListResponse>(
        `/school/students${buildQueryString(filters)}`,
      );
      if (!response.data) throw new Error('The server returned no student list');
      return response.data;
    },
    staleTime: 30_000,
    enabled: options.enabled ?? true,
  });
}
