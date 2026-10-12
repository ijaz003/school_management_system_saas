import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { staffKeys } from './keys';
import type { StaffMember } from './useStaff';

export interface UpdateStaffInput {
  fullName?: string;
  phone?: string;
  roleId?: string;
  subject?: string;
  isActive?: boolean;
}

interface UpdateStaffParams {
  id: string;
  data: UpdateStaffInput;
}

export function useUpdateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: UpdateStaffParams) => {
      const response = await api.patch<StaffMember>(`/school/staff/${id}`, data);
      if (!response.data) throw new Error('The server returned no updated staff member');
      return response.data;
    },
    onSuccess: (_, { id }) => {
      toast.success('Staff updated successfully');
      void queryClient.invalidateQueries({ queryKey: staffKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: staffKeys.detail(id) });
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to update staff'),
  });
}
