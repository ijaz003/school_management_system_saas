import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { studentKeys, type StudentStatus } from './keys';
import type { StudentDetail } from './useStudent';

export interface CreateStudentInput {
  admissionNo?: string;
  fullName: string;
  gender: 'male' | 'female' | 'other';
  dateOfBirth: string;
  bloodGroup?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  classId: string;
  sectionId: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail?: string | null;
  guardianRelation?: string | null;
  status?: StudentStatus;
  admissionDate?: string;
  notes?: string | null;
}

export function useCreateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateStudentInput) => {
      const response = await api.post<StudentDetail>('/school/students', data);
      if (!response.data?.id) throw new Error('The server returned an incomplete student');
      return response.data;
    },
    onSuccess: () => {
      toast.success('Student created');
      void queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to create student'),
  });
}
