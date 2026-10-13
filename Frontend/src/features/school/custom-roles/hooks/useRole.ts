import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { roleKeys } from './keys';
import type { Role } from './useRoles';

export function useRole(id: string) {
  return useQuery({
    queryKey: roleKeys.detail(id),
    queryFn: async () => {
      const response = await api.get<Role>(`/school/roles/${id}`);
      if (!response.data) throw new Error('The server returned no role');
      return response.data;
    },
    enabled: Boolean(id),
  });
}
