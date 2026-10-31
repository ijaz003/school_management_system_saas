import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { classKeys } from './keys';

export function useDeleteClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/school/classes/${id}`);
      return id;
    },
    onSuccess: (id) => {
      toast.success('Class deleted');
      void queryClient.invalidateQueries({ queryKey: classKeys.lists() });
      queryClient.removeQueries({ queryKey: classKeys.detail(id) });
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to delete class'),
  });
}
