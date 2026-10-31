import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  loading,
  className,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  loading?: boolean;
  className?: string;
}) {
  return (
    <section className={cn('panel relative overflow-hidden p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-ink-500">{label}</p>
          {loading ? (
            <div className="mt-3 h-8 w-20 animate-pulse rounded-lg bg-ink-100" />
          ) : (
            <p className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink-950">
              {value}
            </p>
          )}
          {hint ? <p className="mt-1 text-xs text-ink-400">{hint}</p> : null}
        </div>
        {Icon ? (
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
        ) : null}
      </div>
    </section>
  );
}
