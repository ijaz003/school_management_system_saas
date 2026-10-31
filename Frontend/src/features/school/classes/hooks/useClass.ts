import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { classKeys } from './keys';
import type { ClassItem } from './useClasses';

export interface ClassSection {
  id: string;
  name: string;
  fullName: string;
  useClassSubjects: boolean;
  stream: string | null;
  capacity: number;
  classTeacherId: string | null;
  subjects: Array<{ id: string; name: string; code: string; isElective: boolean; isCompulsory?: boolean }>;
}

export interface ClassDetail extends ClassItem {
  sections: ClassSection[];
  subjects: Array<{ id: string; name: string; code: string; isElective: boolean; isCompulsory: boolean }>;
}

export function useClass(id: string) {
  return useQuery({
    queryKey: classKeys.detail(id),
    queryFn: async () => {
      const response = await api.get<ClassDetail>(`/school/classes/${id}`);
      if (!response.data) throw new Error('The server returned no class details');
      return response.data;
    },
    enabled: Boolean(id),
  });
}
