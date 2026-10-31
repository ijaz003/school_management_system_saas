export interface TeacherFilters {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export const teacherKeys = {
  all: ['teachers'] as const,
  lists: () => [...teacherKeys.all, 'list'] as const,
  list: (filters: TeacherFilters) => [...teacherKeys.lists(), filters] as const,
  details: () => [...teacherKeys.all, 'detail'] as const,
  detail: (id: string) => [...teacherKeys.details(), id] as const,
  assignments: (filters?: object) => [...teacherKeys.all, 'assignments', filters ?? {}] as const,
};
