import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { roleKeys } from './keys';
import type { Role } from './useRoles';

export interface CreateRoleInput {
  name: string;
  displayName: string;
  description?: string;
  permissions: string[];
  color?: string;
  icon?: string;
}

export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateRoleInput) => {
      const response = await api.post<Role>('/school/roles', data);
      if (!response.data) throw new Error('The server returned no created role');
      return response.data;
    },
    onSuccess: (role) => {
      toast.success(`Role "${role.displayName}" created`);
      void queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to create role'),
  });
}
