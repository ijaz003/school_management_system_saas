import type { BadgeTone } from '@/components/ui/badge';
import type { SupportCategory, SupportPriority, SupportStatus } from '../hooks/keys';

export const CATEGORY_LABELS: Record<SupportCategory, string> = {
  billing: 'Billing',
  technical: 'Technical',
  account: 'Account',
  feature: 'Feature request',
  other: 'Other',
};

export const PRIORITY_LABELS: Record<SupportPriority, string> = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
};

export const STATUS_LABELS: Record<SupportStatus, string> = {
  open: 'Open',
  in_progress: 'In progress',
  waiting_school: 'Waiting on school',
  resolved: 'Resolved',
  closed: 'Closed',
};

export function statusTone(status: string): BadgeTone {
  switch (status) {
    case 'resolved':
      return 'success';
    case 'closed':
      return 'neutral';
    case 'waiting_school':
      return 'warning';
    case 'in_progress':
      return 'primary';
    default:
      return 'danger';
  }
}

export function priorityTone(priority: string): BadgeTone {
  switch (priority) {
    case 'high':
      return 'danger';
    case 'low':
      return 'neutral';
    default:
      return 'primary';
  }
}

export function formatStatus(status: string) {
  return STATUS_LABELS[status as SupportStatus] ?? status.replace(/_/g, ' ');
}

export function formatCategory(category: string) {
  return CATEGORY_LABELS[category as SupportCategory] ?? category;
}

export function formatPriority(priority: string) {
  return PRIORITY_LABELS[priority as SupportPriority] ?? priority;
}
