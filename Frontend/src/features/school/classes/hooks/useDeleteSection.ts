import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { classKeys } from './keys';

export function useDeleteSection(classId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sectionId: string) => {
      await api.delete(`/school/sections/${sectionId}`);
    },
    onSuccess: () => {
      toast.success('Section deleted');
      void queryClient.invalidateQueries({ queryKey: classKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: classKeys.detail(classId) });
      void queryClient.invalidateQueries({ queryKey: classKeys.sections(classId) });
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to delete section'),
  });
}
