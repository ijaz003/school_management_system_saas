import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { staffKeys } from './keys';

export interface AvailableRole {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  permissions: string[];
  isSystem: boolean;
  isSuperAdmin: boolean;
  color: string | null;
  icon: string | null;
  category: string | null;
}

export function useAvailableRoles() {
  return useQuery({
    queryKey: staffKeys.availableRoles(),
    queryFn: async () => {
      const response = await api.get<AvailableRole[]>('/school/staff/roles/available');
      if (!response.data) throw new Error('The server returned no available roles');
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
