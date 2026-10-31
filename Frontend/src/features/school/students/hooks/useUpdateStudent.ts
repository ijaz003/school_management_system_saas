import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { studentKeys } from './keys';
import type { CreateStudentInput } from './useCreateStudent';
import type { StudentDetail } from './useStudent';

export type UpdateStudentInput = Partial<CreateStudentInput>;

interface UpdateStudentParams {
  id: string;
  data: UpdateStudentInput;
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: UpdateStudentParams) => {
      const response = await api.patch<StudentDetail>(`/school/students/${id}`, data);
      if (!response.data) throw new Error('The server returned no updated student');
      return response.data;
    },
    onSuccess: (_, { id }) => {
      toast.success('Student updated');
      void queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: studentKeys.detail(id) });
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to update student'),
  });
}
