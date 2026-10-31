import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, buildQueryString } from '@/lib/api';
import { teacherKeys } from './keys';

export interface TeacherAssignment {
  id: string;
  teacherId: string;
  teacherName: string;
  sectionId: string;
  sectionName: string;
  sectionFullName: string;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  createdAt: string;
}

export function useAssignments(filters: {
  teacherId?: string;
  sectionId?: string;
  classId?: string;
} = {}) {
  return useQuery({
    queryKey: teacherKeys.assignments(filters),
    queryFn: async () => {
      const response = await api.get<TeacherAssignment[]>(
        `/school/teachers/assignments${buildQueryString(filters)}`,
      );
      if (!response.data) throw new Error('The server returned no assignments');
      return response.data;
    },
  });
}

export function useCreateAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { teacherId: string; sectionId: string; subjectId: string }) => {
      const response = await api.post<TeacherAssignment>('/school/teachers/assignments', data);
      if (!response.data?.id) throw new Error('Assignment was not created');
      return response.data;
    },
    onSuccess: (assignment) => {
      toast.success('Subject teacher assigned');
      void queryClient.invalidateQueries({ queryKey: teacherKeys.all });
      void queryClient.invalidateQueries({ queryKey: teacherKeys.detail(assignment.teacherId) });
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to assign teacher'),
  });
}

export function useDeleteAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assignmentId: string) => {
      await api.delete(`/school/teachers/assignments/${assignmentId}`);
      return assignmentId;
    },
    onSuccess: () => {
      toast.success('Assignment removed');
      void queryClient.invalidateQueries({ queryKey: teacherKeys.all });
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to remove assignment'),
  });
}

export function useSetClassTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { sectionId: string; teacherId: string | null }) => {
      const response = await api.patch<{
        sectionId: string;
        classTeacherId: string | null;
        classTeacherName: string | null;
        fullName: string;
      }>(`/school/teachers/sections/${data.sectionId}/class-teacher`, {
        teacherId: data.teacherId,
      });
      if (!response.data) throw new Error('Class teacher was not updated');
      return response.data;
    },
    onSuccess: () => {
      toast.success('Class teacher updated');
      void queryClient.invalidateQueries({ queryKey: teacherKeys.all });
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to set class teacher'),
  });
}
