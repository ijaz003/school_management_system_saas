import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, buildQueryString } from '@/lib/api';
import { timetableKeys, type TimetableDay } from './keys';

export interface TimetablePeriod {
  id: string;
  name: string;
  sortOrder: number;
  startTime: string;
  endTime: string;
  isBreak: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TimetableEntry {
  id: string;
  sectionId: string;
  periodId: string;
  dayOfWeek: number;
  subjectId: string | null;
  subjectName: string | null;
  subjectCode: string | null;
  teacherId: string | null;
  teacherName: string | null;
  room: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TimetableGrid {
  section: {
    id: string;
    name: string;
    fullName: string;
    classId: string;
    className: string;
  };
  periods: TimetablePeriod[];
  entries: TimetableEntry[];
}

export function useTimetablePeriods(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: timetableKeys.periods(),
    queryFn: async () => {
      const response = await api.get<TimetablePeriod[]>('/school/timetable/periods');
      if (!response.data) throw new Error('The server returned no periods');
      return response.data;
    },
    enabled: options.enabled ?? true,
  });
}

export function useSectionTimetable(
  sectionId: string | undefined,
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: timetableKeys.grid(sectionId ?? ''),
    queryFn: async () => {
      if (!sectionId) throw new Error('Section is required');
      const response = await api.get<TimetableGrid>(
        `/school/timetable${buildQueryString({ sectionId })}`,
      );
      if (!response.data) throw new Error('The server returned no timetable');
      return response.data;
    },
    enabled: (options.enabled ?? true) && Boolean(sectionId),
  });
}

export function useCreateTimetablePeriod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      sortOrder?: number;
      startTime: string;
      endTime: string;
      isBreak?: boolean;
    }) => {
      const response = await api.post<TimetablePeriod>('/school/timetable/periods', data);
      if (!response.data?.id) throw new Error('Period was not created');
      return response.data;
    },
    onSuccess: () => {
      toast.success('Period created');
      void queryClient.invalidateQueries({ queryKey: timetableKeys.all });
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to create period'),
  });
}

export function useUpdateTimetablePeriod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      name?: string;
      sortOrder?: number;
      startTime?: string;
      endTime?: string;
      isBreak?: boolean;
    }) => {
      const { id, ...data } = input;
      const response = await api.patch<TimetablePeriod>(`/school/timetable/periods/${id}`, data);
      if (!response.data) throw new Error('Period was not updated');
      return response.data;
    },
    onSuccess: () => {
      toast.success('Period updated');
      void queryClient.invalidateQueries({ queryKey: timetableKeys.all });
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to update period'),
  });
}

export function useDeleteTimetablePeriod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/school/timetable/periods/${id}`);
      return id;
    },
    onSuccess: () => {
      toast.success('Period deleted');
      void queryClient.invalidateQueries({ queryKey: timetableKeys.all });
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to delete period'),
  });
}

export function useUpsertTimetableEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      sectionId: string;
      periodId: string;
      dayOfWeek: TimetableDay;
      subjectId?: string | null;
      teacherId?: string | null;
      room?: string | null;
    }) => {
      const response = await api.put<TimetableEntry | null>('/school/timetable/entries', data);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      toast.success('Timetable updated');
      void queryClient.invalidateQueries({
        queryKey: timetableKeys.grid(variables.sectionId),
      });
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to save slot'),
  });
}

export function useDeleteTimetableEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; sectionId: string }) => {
      await api.delete(`/school/timetable/entries/${input.id}`);
      return input;
    },
    onSuccess: (input) => {
      toast.success('Slot cleared');
      void queryClient.invalidateQueries({
        queryKey: timetableKeys.grid(input.sectionId),
      });
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to clear slot'),
  });
}
