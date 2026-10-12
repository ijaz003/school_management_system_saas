import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { staffKeys } from './keys';

export function useDeleteStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (staffId: string) => {
      await api.delete(`/school/staff/${staffId}`);
      return staffId;
    },
    onSuccess: (staffId) => {
      toast.success('Staff member deleted');
      void queryClient.invalidateQueries({ queryKey: staffKeys.lists() });
      queryClient.removeQueries({ queryKey: staffKeys.detail(staffId) });
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to delete staff'),
  });
}
