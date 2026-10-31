export const NOTICE_AUDIENCES = ['all', 'staff', 'students', 'parents'] as const;
export type NoticeAudience = (typeof NOTICE_AUDIENCES)[number];

export const NOTICE_STATUSES = ['draft', 'published'] as const;
export type NoticeStatus = (typeof NOTICE_STATUSES)[number];

export interface ListNoticesFilters {
  tenantId: string;
  page?: number;
  limit?: number;
  search?: string;
  status?: NoticeStatus;
  audience?: NoticeAudience;
}

export interface CreateNoticeInput {
  tenantId: string;
  createdBy: string;
  data: {
    title: string;
    body: string;
    audience?: NoticeAudience;
    publish?: boolean;
  };
}

export interface UpdateNoticeInput {
  noticeId: string;
  tenantId: string;
  data: {
    title?: string;
    body?: string;
    audience?: NoticeAudience;
  };
}
