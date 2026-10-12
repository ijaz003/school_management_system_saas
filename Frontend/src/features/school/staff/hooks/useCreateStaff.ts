import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { staffKeys } from './keys';
import type { StaffMember } from './useStaff';

export interface CreateStaffInput {
  fullName: string;
  email: string;
  phone: string;
  roleId: string;
  subject?: string;
  joiningDate?: string;
  sendEmail?: boolean;
}

export interface CreateStaffResponse {
  staff: StaffMember;
  tempPassword: string;
  emailSent: boolean;
}

export function useCreateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateStaffInput) => {
      const response = await api.post<CreateStaffResponse>('/school/staff', data);
      if (!response.data?.staff?.id || !response.data.tempPassword) {
        throw new Error('The server returned an incomplete staff creation response');
      }
      return response.data;
    },
    onSuccess: () => {
      toast.success('Staff member created');
      void queryClient.invalidateQueries({ queryKey: staffKeys.lists() });
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to create staff'),
  });
}
