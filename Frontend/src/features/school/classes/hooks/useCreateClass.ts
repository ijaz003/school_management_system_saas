import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { classKeys } from './keys';

export interface CreateClassInput {
  name: string;
  order: number;
  type: 'common' | 'streamed';
  description?: string;
}

export function useCreateClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateClassInput) => {
      const response = await api.post('/school/classes', data);
      if (!response.data) throw new Error('The server returned no created class');
      return response.data;
    },
    onSuccess: () => {
      toast.success('Class created');
      void queryClient.invalidateQueries({ queryKey: classKeys.lists() });
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to create class'),
  });
}
