import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { subjectKeys } from './keys';

export function useDeleteSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/school/subjects/${id}`);
      return id;
    },
    onSuccess: () => {
      toast.success('Subject deleted');
      void queryClient.invalidateQueries({ queryKey: subjectKeys.lists() });
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to delete subject'),
  });
}
