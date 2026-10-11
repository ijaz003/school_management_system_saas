import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { schoolKeys } from './keys';
import type { School } from './useSchools';

export function useSchool(id: string) {
  return useQuery({
    queryKey: schoolKeys.detail(id),
    queryFn: async () => {
      const response = await api.get<School>(`/super-admin/schools/${id}`);
      if (!response.data) throw new Error('The server returned no school details');
      return response.data;
    },
    enabled: Boolean(id),
  });
}
