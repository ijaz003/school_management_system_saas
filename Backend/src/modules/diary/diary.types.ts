export const DIARY_STATUSES = ['draft', 'published'] as const;
export type DiaryStatus = (typeof DIARY_STATUSES)[number];

export interface ListDiaryFilters {
  tenantId: string;
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

export interface CreateDiaryInput {
  tenantId: string;
  createdBy: string;
  data: {
    entryDate: string;
    classId: string;
    sectionId?: string | null;
    title: string;
    homework: string;
    classwork?: string | null;
    remarks?: string | null;
    publish?: boolean;
  };
}

export interface UpdateDiaryInput {
  entryId: string;
  tenantId: string;
  data: {
    entryDate?: string;
    classId?: string;
    sectionId?: string | null;
    title?: string;
    homework?: string;
    classwork?: string | null;
    remarks?: string | null;
  };
}
