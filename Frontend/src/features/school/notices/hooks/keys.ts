export type NoticeStatus = 'draft' | 'published';
export type NoticeAudience = 'all' | 'staff' | 'students' | 'parents';

export interface NoticeFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: NoticeStatus;
  audience?: NoticeAudience;
}

export const noticeKeys = {
  all: ['notices'] as const,
  lists: () => [...noticeKeys.all, 'list'] as const,
  list: (filters: NoticeFilters) => [...noticeKeys.lists(), filters] as const,
  details: () => [...noticeKeys.all, 'detail'] as const,
  detail: (id: string) => [...noticeKeys.details(), id] as const,
};
