import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { classKeys } from './keys';
import type { ClassSection } from './useClass';

export function useSections(classId: string) {
  return useQuery({
    queryKey: classKeys.sections(classId),
    queryFn: async () => {
      const response = await api.get<ClassSection[]>(`/school/classes/${classId}/sections`);
      if (!response.data) throw new Error('The server returned no sections');
      return response.data;
    },
    enabled: Boolean(classId),
  });
}
