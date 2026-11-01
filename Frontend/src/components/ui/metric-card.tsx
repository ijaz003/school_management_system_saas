import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type MetricTone = 'primary' | 'success' | 'warning' | 'neutral' | 'danger';

const toneMap: Record<
  MetricTone,
  { wrap: string; icon: string }
> = {
  primary: {
    wrap: 'from-primary-50 to-white ring-primary-100',
    icon: 'bg-primary-100 text-primary-700',
  },
  success: {
    wrap: 'from-emerald-50 to-white ring-emerald-100',
    icon: 'bg-emerald-100 text-emerald-700',
  },
  warning: {
    wrap: 'from-amber-50 to-white ring-amber-100',
    icon: 'bg-amber-100 text-amber-700',
  },
  neutral: {
    wrap: 'from-ink-50 to-white ring-ink-100',
    icon: 'bg-ink-100 text-ink-600',
  },
  danger: {
    wrap: 'from-danger-50 to-white ring-danger-100',
    icon: 'bg-danger-100 text-danger-700',
  },
};

export function MetricCard({
  icon,
  label,
  value,
  tone = 'neutral',
  className,
}: {
  icon?: ReactNode;
  label: string;
  value: string | number;
  tone?: MetricTone;
  className?: string;
}) {
  const styles = toneMap[tone];
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-2xl bg-gradient-to-br p-4 shadow-sm ring-1 ring-inset',
        styles.wrap,
        className,
      )}
    >
      {icon ? (
        <span
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
            styles.icon,
          )}
        >
          {icon}
        </span>
      ) : null}
      <div className="min-w-0">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-500">
          {label}
        </p>
        <p
          className="font-display text-[18px] font-semibold tracking-tight text-ink-950"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

export function MetricGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-live="polite">
      {children}
    </div>
  );
}
