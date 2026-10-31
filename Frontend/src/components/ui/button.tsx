import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const variants = {
      primary:
        'bg-primary-700 text-white hover:bg-primary-800 focus-visible:ring-primary-600 shadow-sm',
      secondary:
        'bg-ink-100 text-ink-900 hover:bg-ink-200 focus-visible:ring-ink-400',
      outline:
        'border border-ink-200 bg-white text-ink-800 hover:bg-ink-50 focus-visible:ring-primary-600',
      ghost: 'text-ink-700 hover:bg-ink-100 focus-visible:ring-ink-400',
      danger:
        'bg-danger-600 text-white hover:bg-danger-700 focus-visible:ring-danger-600 shadow-sm',
    };
    const sizes = {
      sm: 'h-8 rounded-lg px-3 text-xs',
      md: 'h-10 rounded-xl px-4 text-sm',
      lg: 'h-11 rounded-xl px-5 text-sm',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-semibold transition duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'active:scale-[0.98]',
          variants[variant],
          sizes[size],
          className,
        )}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading && (
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
