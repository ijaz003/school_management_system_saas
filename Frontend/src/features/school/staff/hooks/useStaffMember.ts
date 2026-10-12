import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { staffKeys } from './keys';
import type { StaffMember } from './useStaff';

export function useStaffMember(id: string) {
  return useQuery({
    queryKey: staffKeys.detail(id),
    queryFn: async () => {
      const response = await api.get<StaffMember>(`/school/staff/${id}`);
      if (!response.data) throw new Error('The server returned no staff member');
      return response.data;
    },
    enabled: Boolean(id),
  });
}
