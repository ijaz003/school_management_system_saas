import { useQuery } from '@tanstack/react-query';
import { api, buildQueryString } from '@/lib/api';
import { subjectKeys } from './keys';

export interface Subject {
  id: string;
  name: string;
  code: string;
  description: string | null;
  isElective: boolean;
  usedInClasses: number;
  usedInSections: number;
  createdAt: string;
}

export function useSubjects(search?: string) {
  return useQuery({
    queryKey: subjectKeys.list(search),
    queryFn: async () => {
      const response = await api.get<Subject[]>(`/school/subjects${buildQueryString({ search })}`);
      if (!response.data) throw new Error('The server returned no subject list');
      return response.data;
    },
    staleTime: 30_000,
  });
}
