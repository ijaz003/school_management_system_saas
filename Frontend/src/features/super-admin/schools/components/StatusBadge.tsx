import { cn } from '@/lib/utils';
import type { SchoolStatus } from '../hooks/keys';

const statusStyles: Record<SchoolStatus, { label: string; className: string }> = {
  trial: { label: 'Trial', className: 'bg-primary-50 text-primary-800' },
  active: { label: 'Active', className: 'bg-success-100 text-success-700' },
  suspended: { label: 'Suspended', className: 'bg-danger-100 text-danger-700' },
  cancelled: { label: 'Cancelled', className: 'bg-ink-100 text-ink-700' },
};

export function StatusBadge({ status }: { status: SchoolStatus }) {
  const config = statusStyles[status];
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', config.className)}>
      {config.label}
    </span>
  );
}
