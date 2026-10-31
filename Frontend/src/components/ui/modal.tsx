import {
  useEffect,
  useId,
  type HTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

interface ModalProps {
  open?: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: ModalSize;
  variant?: 'default' | 'danger';
  closeOnOverlay?: boolean;
  closeDisabled?: boolean;
  className?: string;
  bodyClassName?: string;
  role?: 'dialog' | 'alertdialog';
  labelledBy?: string;
  describedBy?: string;
}

const SIZE_CLASS: Record<ModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export function Modal({
  open = true,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  variant = 'default',
  closeOnOverlay = true,
  closeDisabled = false,
  className,
  bodyClassName,
  role = 'dialog',
  labelledBy,
  describedBy,
}: ModalProps) {
  const reactId = useId();
  const titleId = labelledBy ?? `modal-title-${reactId}`;
  const descriptionId = describedBy ?? (description ? `modal-desc-${reactId}` : undefined);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !closeDisabled) onClose();
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [closeDisabled, onClose, open]);

  if (!open) return null;

  const handleOverlayMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    if (!closeOnOverlay || closeDisabled) return;
    if (event.target === event.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center sm:p-6"
      role="presentation"
      onMouseDown={handleOverlayMouseDown}
    >
      <div
        className="absolute inset-0 animate-fade-in bg-ink-950/50 backdrop-blur-[2px]"
        aria-hidden="true"
      />
      <section
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className={cn(
          'relative my-6 flex max-h-[min(92vh,880px)] w-full animate-fade-up flex-col overflow-hidden rounded-3xl border border-ink-100/80 bg-white shadow-lift',
          SIZE_CLASS[size],
          className,
        )}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-28 opacity-80"
          style={{
            background:
              variant === 'danger'
                ? 'radial-gradient(420px 120px at 10% 0%, rgb(239 68 68 / 0.12), transparent 70%)'
                : 'radial-gradient(420px 120px at 10% 0%, rgb(42 148 124 / 0.12), transparent 70%)',
          }}
          aria-hidden="true"
        />

        <header className="relative flex items-start gap-4 border-b border-ink-100 px-5 py-5 sm:px-6">
          {variant === 'danger' && (
            <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600 ring-1 ring-red-100">
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="font-display text-xl font-semibold tracking-tight text-ink-950">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="mt-1 text-sm leading-relaxed text-ink-700/70">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={closeDisabled}
            aria-label="Close"
            className="rounded-xl p-2 text-ink-700/55 transition-colors hover:bg-ink-100 hover:text-ink-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <div className={cn('relative flex-1 overflow-y-auto px-5 py-5 sm:px-6', bodyClassName)}>
          {children}
        </div>

        {footer && (
          <footer className="relative flex flex-wrap items-center justify-end gap-3 border-t border-ink-100 bg-surface/60 px-5 py-4 sm:px-6">
            {footer}
          </footer>
        )}
      </section>
    </div>
  );
}

export function ModalSection({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={cn('rounded-2xl border border-ink-100 bg-surface/50 p-4', className)}
      {...props}
    />
  );
}
