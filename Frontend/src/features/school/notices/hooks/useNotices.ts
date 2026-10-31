import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, buildQueryString } from '@/lib/api';
import { noticeKeys, type NoticeAudience, type NoticeFilters, type NoticeStatus } from './keys';

export interface Notice {
  id: string;
  title: string;
  body: string;
  audience: NoticeAudience;
  status: NoticeStatus;
  publishedAt: string | null;
  createdBy: string | null;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
}

export function useNotices(filters: NoticeFilters = {}) {
  return useQuery({
    queryKey: noticeKeys.list(filters),
    queryFn: async () => {
      const response = await api.get<{
        items: Notice[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
      }>(`/school/notices${buildQueryString(filters)}`);
      if (!response.data) throw new Error('The server returned no notices');
      return response.data;
    },
  });
}

export function useCreateNotice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      title: string;
      body: string;
      audience?: NoticeAudience;
      publish?: boolean;
    }) => {
      const response = await api.post<Notice>('/school/notices', data);
      if (!response.data?.id) throw new Error('Notice was not created');
      return response.data;
    },
    onSuccess: () => {
      toast.success('Notice created');
      void queryClient.invalidateQueries({ queryKey: noticeKeys.lists() });
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to create notice'),
  });
}

export function usePublishNotice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post<Notice>(`/school/notices/${id}/publish`);
      if (!response.data) throw new Error('Notice was not published');
      return response.data;
    },
    onSuccess: () => {
      toast.success('Notice published');
      void queryClient.invalidateQueries({ queryKey: noticeKeys.all });
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to publish notice'),
  });
}

export function useDeleteNotice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/school/notices/${id}`);
      return id;
    },
    onSuccess: () => {
      toast.success('Notice deleted');
      void queryClient.invalidateQueries({ queryKey: noticeKeys.lists() });
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to delete notice'),
  });
}
