import type { ReactNode } from 'react';
import { PageHeader } from './page-header';
import { cn } from '@/lib/utils';

export function PageShell({
  eyebrow,
  title,
  description,
  actions,
  children,
  className,
  footerNote,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  footerNote?: ReactNode;
}) {
  return (
    <div className={cn('mx-auto max-w-6xl space-y-6 pb-12', className)}>
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white via-white to-ink-50/60 px-5 py-6 shadow-sm ring-1 ring-ink-100 sm:px-7 sm:py-7">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary-100/40 blur-3xl"
        />
        <div className="relative">
          <PageHeader
            eyebrow={eyebrow}
            title={title}
            description={description}
            actions={actions}
          />
        </div>
      </div>

      {children}

      {footerNote ? (
        <div className="flex items-center justify-center gap-1.5 pt-2 text-[11px] text-ink-400">
          {footerNote}
        </div>
      ) : null}
    </div>
  );
}
