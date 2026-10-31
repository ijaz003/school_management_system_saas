import { useQuery } from '@tanstack/react-query';
import { api, buildQueryString } from '@/lib/api';
import { classKeys } from './keys';

export interface ClassItem {
  id: string;
  name: string;
  order: number;
  type: 'common' | 'streamed';
  description: string | null;
  sectionsCount: number;
  subjectsCount: number;
  createdAt: string;
}

export function useClasses(search?: string) {
  return useQuery({
    queryKey: classKeys.list(search),
    queryFn: async () => {
      const response = await api.get<ClassItem[]>(`/school/classes${buildQueryString({ search })}`);
      if (!response.data) throw new Error('The server returned no class list');
      return response.data;
    },
    staleTime: 30_000,
  });
}
