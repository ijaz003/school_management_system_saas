import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { roleKeys } from './keys';

export interface Permission {
  id: string;
  key: string;
  displayName: string;
  description: string | null;
  module: string;
  action: string;
  category: string | null;
  isActive: boolean;
  isAssignableToSchools: boolean;
}

export interface PermissionGroup {
  module: string;
  displayName: string;
  permissions: Permission[];
}

export interface AvailablePermissionsResponse {
  grouped: Record<string, PermissionGroup>;
  total: number;
}

export function useAvailablePermissions() {
  return useQuery({
    queryKey: roleKeys.availablePermissions(),
    queryFn: async () => {
      const response = await api.get<AvailablePermissionsResponse>(
        '/school/roles/available-permissions',
      );
      if (!response.data) throw new Error('The server returned no permissions');
      return response.data;
    },
    staleTime: 5 * 60_000,
  });
}
