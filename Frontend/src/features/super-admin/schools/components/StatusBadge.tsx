import { cn } from '@/lib/utils';
import type { SchoolStatus } from '../hooks/keys';

const statusStyles: Record<SchoolStatus, { label: string; className: string }> = {
  trial: { label: 'Trial', className: 'bg-blue-100 text-blue-700' },
  active: { label: 'Active', className: 'bg-green-100 text-green-700' },
  suspended: { label: 'Suspended', className: 'bg-red-100 text-red-700' },
  cancelled: { label: 'Cancelled', className: 'bg-gray-100 text-gray-700' },
};

export function StatusBadge({ status }: { status: SchoolStatus }) {
  const config = statusStyles[status];
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', config.className)}>
      {config.label}
    </span>
  );
}
