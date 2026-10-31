import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { teacherKeys } from './keys';
import type { TeacherListItem } from './useTeachers';
import type { TeacherAssignment } from './useAssignments';

export interface ClassTeacherSection {
  sectionId: string;
  sectionName: string;
  fullName: string;
  classId: string;
  className: string;
}

export interface TeacherDetail extends TeacherListItem {
  assignments: TeacherAssignment[];
  classTeacherSections: ClassTeacherSection[];
}

export function useTeacher(id: string) {
  return useQuery({
    queryKey: teacherKeys.detail(id),
    queryFn: async () => {
      const response = await api.get<TeacherDetail>(`/school/teachers/${id}`);
      if (!response.data) throw new Error('The server returned no teacher details');
      return response.data;
    },
    enabled: Boolean(id),
  });
}
