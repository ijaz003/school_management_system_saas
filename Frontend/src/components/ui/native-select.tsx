import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface NativeSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const NativeSelect = forwardRef<HTMLSelectElement, NativeSelectProps>(
  ({ className, label, error, hint, id, children, ...props }, ref) => (
    <div className="w-full">
      {label ? (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink-800">
          {label}
          {props.required ? <span className="text-danger-600"> *</span> : null}
        </label>
      ) : null}
      <select
        ref={ref}
        id={id}
        aria-invalid={Boolean(error)}
        className={cn(
          'field-select h-10 w-full rounded-xl border bg-white px-3 text-sm text-ink-900 transition',
          'hover:border-ink-300 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500/40',
          'disabled:cursor-not-allowed disabled:bg-ink-50 disabled:text-ink-400',
          error ? 'border-danger-600 focus:ring-danger-600/30' : 'border-ink-200',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {hint && !error ? <p className="mt-1 text-xs text-ink-500">{hint}</p> : null}
      {error ? <p className="mt-1 text-xs text-danger-600">{error}</p> : null}
    </div>
  ),
);

NativeSelect.displayName = 'NativeSelect';
