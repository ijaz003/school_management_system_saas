import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, buildQueryString } from '@/lib/api';
import { diaryKeys, type DiaryFilters, type DiaryStatus } from './keys';

export interface DiaryEntry {
  id: string;
  entryDate: string;
  classId: string;
  className: string | null;
  sectionId: string | null;
  sectionName: string | null;
  title: string;
  homework: string;
  classwork: string | null;
  remarks: string | null;
  status: DiaryStatus;
  publishedAt: string | null;
  createdBy: string | null;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
}

export function useDiaryEntries(
  filters: DiaryFilters = {},
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: diaryKeys.list(filters),
    queryFn: async () => {
      const response = await api.get<{
        items: DiaryEntry[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
      }>(`/school/diary${buildQueryString(filters)}`);
      if (!response.data) throw new Error('The server returned no diary entries');
      return response.data;
    },
    enabled: options.enabled ?? true,
  });
}

export function useCreateDiaryEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      entryDate: string;
      classId: string;
      sectionId?: string | null;
      title: string;
      homework: string;
      classwork?: string | null;
      remarks?: string | null;
      publish?: boolean;
    }) => {
      const response = await api.post<DiaryEntry>('/school/diary', data);
      if (!response.data?.id) throw new Error('Diary entry was not created');
      return response.data;
    },
    onSuccess: () => {
      toast.success('Diary entry created');
      void queryClient.invalidateQueries({ queryKey: diaryKeys.lists() });
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to create diary entry'),
  });
}

export function usePublishDiaryEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post<DiaryEntry>(`/school/diary/${id}/publish`);
      if (!response.data) throw new Error('Diary entry was not published');
      return response.data;
    },
    onSuccess: () => {
      toast.success('Diary entry published');
      void queryClient.invalidateQueries({ queryKey: diaryKeys.all });
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to publish diary entry'),
  });
}

export function useDeleteDiaryEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/school/diary/${id}`);
      return id;
    },
    onSuccess: () => {
      toast.success('Diary entry deleted');
      void queryClient.invalidateQueries({ queryKey: diaryKeys.lists() });
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to delete diary entry'),
  });
}
