export const SUPPORT_CATEGORIES = [
  'billing',
  'technical',
  'account',
  'feature',
  'other',
] as const;
export type SupportCategory = (typeof SUPPORT_CATEGORIES)[number];

export const SUPPORT_PRIORITIES = ['low', 'normal', 'high'] as const;
export type SupportPriority = (typeof SUPPORT_PRIORITIES)[number];

export const SUPPORT_STATUSES = [
  'open',
  'in_progress',
  'waiting_school',
  'resolved',
  'closed',
] as const;
export type SupportStatus = (typeof SUPPORT_STATUSES)[number];

export interface ListSupportTicketsFilters {
  tenantId?: string;
  page?: number;
  limit?: number;
  search?: string;
  status?: SupportStatus;
  category?: SupportCategory;
  priority?: SupportPriority;
}

export interface CreateSupportTicketData {
  subject: string;
  body: string;
  category?: SupportCategory;
  priority?: SupportPriority;
}

export interface UpdateSupportTicketData {
  status?: SupportStatus;
  priority?: SupportPriority;
  category?: SupportCategory;
  assignedTo?: string | null;
}

export interface CreateSupportMessageData {
  body: string;
  isInternal?: boolean;
}
