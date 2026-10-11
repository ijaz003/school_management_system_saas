import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { schoolKeys } from './keys';

export function useDeleteSchool() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (schoolId: string) => {
      await api.delete(`/super-admin/schools/${schoolId}`);
    },
    onSuccess: (_, schoolId) => {
      toast.success('School deleted');
      void queryClient.invalidateQueries({ queryKey: schoolKeys.lists() });
      queryClient.removeQueries({ queryKey: schoolKeys.detail(schoolId) });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete school');
    },
  });
}
