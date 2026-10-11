import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { schoolKeys } from './keys';

export interface CreateSchoolInput {
  name: string;
  slug: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  city?: string;
  address?: string;
  plan: 'basic' | 'standard' | 'premium';
}

export interface CreateSchoolResponse {
  tenant: {
    id: string;
    name: string;
    slug: string;
    plan: string;
    status: string;
  };
  admin: {
    id: string;
    email: string;
    tempPassword: string;
    fullName: string;
  };
}

export function useCreateSchool() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSchoolInput) => {
      const response = await api.post<CreateSchoolResponse>('/super-admin/schools', data);
      if (!response.data?.tenant?.id || !response.data.admin?.tempPassword) {
        throw new Error('The server returned an incomplete school creation response');
      }
      return response.data;
    },
    onSuccess: () => {
      toast.success('School created successfully');
      void queryClient.invalidateQueries({ queryKey: schoolKeys.lists() });
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to create school'),
  });
}
