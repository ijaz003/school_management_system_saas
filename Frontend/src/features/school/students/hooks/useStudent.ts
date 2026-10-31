import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { studentKeys, type StudentStatus } from './keys';
import type { StudentListItem } from './useStudents';

export interface StudentDetail extends StudentListItem {
  bloodGroup: string | null;
  address: string | null;
  guardianEmail: string | null;
  guardianRelation: string | null;
  notes: string | null;
  updatedAt: string;
  status: StudentStatus;
}

export function useStudent(id: string) {
  return useQuery({
    queryKey: studentKeys.detail(id),
    queryFn: async () => {
      const response = await api.get<StudentDetail>(`/school/students/${id}`);
      if (!response.data) throw new Error('The server returned no student details');
      return response.data;
    },
    enabled: Boolean(id),
  });
}
