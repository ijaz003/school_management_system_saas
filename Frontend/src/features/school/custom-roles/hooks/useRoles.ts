import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { roleKeys } from './keys';

export interface Role {
  id: string;
  tenantId: string | null;
  name: string;
  displayName: string;
  description: string | null;
  permissions: string[];
  isSystem: boolean;
  isSuperAdmin: boolean;
  color: string | null;
  icon: string | null;
  category: string | null;
  userCount: number;
}

export function useRoles() {
  return useQuery({
    queryKey: roleKeys.lists(),
    queryFn: async () => {
      const response = await api.get<Role[]>('/school/roles');
      if (!response.data) throw new Error('The server returned no roles');
      return response.data;
    },
    staleTime: 30_000,
  });
}
