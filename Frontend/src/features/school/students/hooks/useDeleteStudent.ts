import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { studentKeys } from './keys';

export function useDeleteStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (studentId: string) => {
      await api.delete(`/school/students/${studentId}`);
      return studentId;
    },
    onSuccess: (studentId) => {
      toast.success('Student deleted');
      void queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
      queryClient.removeQueries({ queryKey: studentKeys.detail(studentId) });
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to delete student'),
  });
}
