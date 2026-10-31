import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { classKeys } from './keys';

export interface CreateSectionInput {
  classId: string;
  name: string;
  useClassSubjects: boolean;
  stream?: string;
  capacity?: number;
  classTeacherId?: string;
  subjectIds?: string[];
}

export function useCreateSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ classId, ...data }: CreateSectionInput) => {
      const response = await api.post(`/school/sections`, { classId, ...data });
      if (!response.data) throw new Error('The server returned no created section');
      return response.data;
    },
    onSuccess: (_, { classId }) => {
      toast.success('Section created');
      void queryClient.invalidateQueries({ queryKey: classKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: classKeys.detail(classId) });
      void queryClient.invalidateQueries({ queryKey: classKeys.sections(classId) });
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to create section'),
  });
}
