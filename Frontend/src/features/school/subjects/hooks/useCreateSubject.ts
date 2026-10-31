import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { subjectKeys } from './keys';
import type { Subject } from './useSubjects';

export interface CreateSubjectInput {
  name: string;
  code: string;
  description?: string;
  isElective?: boolean;
}

export function useCreateSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateSubjectInput) => {
      const response = await api.post<Subject>('/school/subjects', data);
      if (!response.data) throw new Error('The server returned no created subject');
      return response.data;
    },
    onSuccess: (subject) => {
      toast.success(`Subject "${subject.name}" created`);
      void queryClient.invalidateQueries({ queryKey: subjectKeys.lists() });
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to create subject'),
  });
}
