export type SupportCategory =
  | 'billing'
  | 'technical'
  | 'account'
  | 'feature'
  | 'other';

export type SupportPriority = 'low' | 'normal' | 'high';

export type SupportStatus =
  | 'open'
  | 'in_progress'
  | 'waiting_school'
  | 'resolved'
  | 'closed';

export interface SupportTicketFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: SupportStatus;
  category?: SupportCategory;
  priority?: SupportPriority;
  tenantId?: string;
}

export const supportKeys = {
  all: ['support'] as const,
  lists: () => [...supportKeys.all, 'list'] as const,
  list: (scope: 'school' | 'platform', filters: SupportTicketFilters) =>
    [...supportKeys.lists(), scope, filters] as const,
  details: () => [...supportKeys.all, 'detail'] as const,
  detail: (scope: 'school' | 'platform', id: string) =>
    [...supportKeys.details(), scope, id] as const,
};
