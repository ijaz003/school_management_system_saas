import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RoleBadgeProps {
  name: string;
  color?: string | null;
  isSystem?: boolean;
  className?: string;
}

export function RoleBadge({ name, color = '#2563eb', isSystem, className }: RoleBadgeProps) {
  const resolvedColor = color ?? '#2563eb';
  return (
    <span
      className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium', className)}
      style={{ backgroundColor: `${resolvedColor}18`, color: resolvedColor }}
    >
      {isSystem && <Lock className="h-3 w-3" aria-label="System role" />}
      {name}
    </span>
  );
}
