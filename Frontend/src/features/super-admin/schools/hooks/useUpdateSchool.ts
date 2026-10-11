import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { schoolKeys } from './keys';

export interface UpdateSchoolInput {
  name?: string;
  city?: string | null;
  address?: string | null;
  logoUrl?: string | null;
  plan?: 'basic' | 'standard' | 'premium';
}

interface UpdateSchoolParams {
  id: string;
  data: UpdateSchoolInput;
}

export function useUpdateSchool() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: UpdateSchoolParams) => {
      const response = await api.patch(`/super-admin/schools/${id}`, data);
      return response.data;
    },
    onSuccess: (_, { id }) => {
      toast.success('School updated successfully');
      void queryClient.invalidateQueries({ queryKey: schoolKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: schoolKeys.detail(id) });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update school');
    },
  });
}
