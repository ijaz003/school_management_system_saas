import type { ReactNode } from 'react';
import { Filter, RotateCcw, Rows3 } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

export const PAGE_LIMIT_OPTIONS = [10, 20, 50, 100] as const;

export function FiltersPanel({
  title = 'Filters',
  description,
  children,
  onClear,
  clearDisabled,
  pageLimit,
  onPageLimitChange,
  className,
  actions,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  onClear?: () => void;
  clearDisabled?: boolean;
  pageLimit?: number;
  onPageLimitChange?: (limit: number) => void;
  className?: string;
  actions?: ReactNode;
}) {
  const showToolbar = Boolean(onClear || onPageLimitChange || actions);

  return (
    <section className={cn('rounded-2xl bg-white p-4 shadow-sm ring-1 ring-ink-100', className)}>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-ink-100/70 text-ink-600">
            <Filter className="h-3.5 w-3.5" aria-hidden />
          </span>
          <div>
            <p className="text-[12.5px] font-semibold tracking-tight text-ink-900">{title}</p>
            {description ? (
              <p className="text-[11px] text-ink-500">{description}</p>
            ) : null}
          </div>
        </div>

        {showToolbar ? (
          <div className="flex flex-wrap items-center gap-2">
            {onPageLimitChange ? (
              <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                <Rows3 className="h-3.5 w-3.5 text-ink-400" aria-hidden />
                <span className="sr-only sm:not-sr-only">Page limit</span>
                <select
                  aria-label="Rows per page"
                  className="field-select h-9 min-w-[4.5rem] py-1 text-[13px] font-medium normal-case tracking-normal"
                  value={pageLimit ?? 20}
                  onChange={(event) => onPageLimitChange(Number(event.target.value))}
                >
                  {PAGE_LIMIT_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            {actions}
            {onClear ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={clearDisabled}
                onClick={onClear}
                className="transition active:scale-[0.98]"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                Clear filters
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-12">{children}</div>
    </section>
  );
}

export function FilterField({
  id,
  label,
  icon,
  className,
  children,
}: {
  id?: string;
  label: string;
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-500"
      >
        {icon}
        {label}
      </label>
      {children}
    </div>
  );
}
