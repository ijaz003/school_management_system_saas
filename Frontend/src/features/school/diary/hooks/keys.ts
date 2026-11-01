export type DiaryStatus = 'draft' | 'published';

export interface DiaryFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: DiaryStatus;
  classId?: string;
  sectionId?: string;
  entryDate?: string;
  fromDate?: string;
  toDate?: string;
}

export const diaryKeys = {
  all: ['diary'] as const,
  lists: () => [...diaryKeys.all, 'list'] as const,
  list: (filters: DiaryFilters) => [...diaryKeys.lists(), filters] as const,
  details: () => [...diaryKeys.all, 'detail'] as const,
  detail: (id: string) => [...diaryKeys.details(), id] as const,
};
