import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { classKeys } from './keys';

export function useAddSubjects() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ classId, subjectIds }: { classId: string; subjectIds: string[] }) => {
      const response = await api.post(`/school/classes/${classId}/subjects`, { subjectIds });
      return response.data;
    },
    onSuccess: (_, { classId }) => {
      toast.success('Subjects added to class');
      void queryClient.invalidateQueries({ queryKey: classKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: classKeys.detail(classId) });
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to add subjects'),
  });
}
