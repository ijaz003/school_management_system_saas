import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { roleKeys } from './keys';

export function useDeleteRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/school/roles/${id}`);
      return id;
    },
    onSuccess: (id) => {
      toast.success('Role deleted');
      void queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
      queryClient.removeQueries({ queryKey: roleKeys.detail(id) });
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to delete role'),
  });
}
