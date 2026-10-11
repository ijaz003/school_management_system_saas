import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { schoolKeys } from './keys';

export function useSuspendSchool() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (schoolId: string) => {
      await api.post(`/super-admin/schools/${schoolId}/suspend`);
    },
    onSuccess: (_, schoolId) => {
      toast.success('School suspended');
      void queryClient.invalidateQueries({ queryKey: schoolKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: schoolKeys.detail(schoolId) });
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to suspend school'),
  });
}
