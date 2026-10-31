import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-dashed border-ink-200 bg-surface px-6 py-14 text-center">
      {Icon ? (
        <Icon className="mx-auto h-10 w-10 text-ink-300" aria-hidden="true" strokeWidth={1.5} />
      ) : null}
      <h2 className="mt-3 font-display text-lg font-semibold text-ink-950">{title}</h2>
      {description ? <p className="mx-auto mt-1 max-w-md text-sm text-ink-500">{description}</p> : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </section>
  );
}
