import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { roleKeys } from './keys';
import type { Role } from './useRoles';

export interface UpdateRoleInput {
  displayName?: string;
  description?: string;
  permissions?: string[];
  color?: string;
  icon?: string;
}

interface UpdateRoleParams {
  id: string;
  data: UpdateRoleInput;
}

export function useUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: UpdateRoleParams) => {
      const response = await api.patch<Role>(`/school/roles/${id}`, data);
      if (!response.data) throw new Error('The server returned no updated role');
      return response.data;
    },
    onSuccess: (role, { id }) => {
      toast.success(`Role "${role.displayName}" updated`);
      void queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: roleKeys.detail(id) });
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to update role'),
  });
}
