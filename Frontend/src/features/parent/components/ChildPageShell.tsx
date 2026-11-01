import type { ReactNode } from 'react';
import { GraduationCap } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PageShell } from '@/components/ui/page-shell';
import { PageLoader } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { useParentChildren } from '../hooks/useParentPortal';
import { childPath, type ChildSection } from '../paths';

const TABS: Array<{ section: ChildSection; label: string }> = [
  { section: '', label: 'Overview' },
  { section: 'attendance', label: 'Attendance' },
  { section: 'fees', label: 'Fees' },
  { section: 'diary', label: 'Diary' },
  { section: 'results', label: 'Results' },
];

export function ChildSwitcher({
  studentId,
  section,
}: {
  studentId: string;
  section: ChildSection;
}) {
  const navigate = useNavigate();
  const childrenQuery = useParentChildren();
  const children = childrenQuery.data ?? [];
  if (children.length < 2) return null;

  return (
    <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
      <GraduationCap className="h-3.5 w-3.5 text-ink-400" aria-hidden="true" />
      <span className="sr-only sm:not-sr-only">Child</span>
      <select
        aria-label="Switch child"
        className="field-select h-9 min-w-[10rem] py-1 text-[13px] font-medium normal-case tracking-normal"
        value={studentId}
        onChange={(event) => navigate(childPath(event.target.value, section))}
      >
        {children.map((child) => (
          <option key={child.id} value={child.id}>
            {child.fullName}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ChildPageShell({
  studentId,
  section,
  title,
  description,
  children,
}: {
  studentId: string;
  section: ChildSection;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const childrenQuery = useParentChildren();
  const child = childrenQuery.data?.find((item) => item.id === studentId);

  if (childrenQuery.isPending) {
    return (
      <AppLayout>
        <PageLoader />
      </AppLayout>
    );
  }

  if (childrenQuery.error) {
    return (
      <AppLayout>
        <section className="rounded-2xl border border-danger-100 bg-white p-8 text-center shadow-sm">
          <h2 className="font-display font-semibold text-ink-950">Could not load your children</h2>
          <p className="mt-2 text-sm text-ink-600">{childrenQuery.error.message}</p>
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => void childrenQuery.refetch()}
            isLoading={childrenQuery.isFetching}
          >
            Try again
          </Button>
        </section>
      </AppLayout>
    );
  }

  if (!child) {
    return (
      <AppLayout>
        <EmptyState
          icon={GraduationCap}
          title="Child not found"
          description="This student is not linked to your account."
          action={
            <Link to="/parent">
              <Button variant="outline">Back to home</Button>
            </Link>
          }
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageShell
        eyebrow={`${child.fullName} · ${child.className} ${child.sectionName}`}
        title={title}
        description={description}
        actions={<ChildSwitcher studentId={studentId} section={section} />}
      >
        <nav
          aria-label="Child sections"
          className="flex flex-wrap gap-1 rounded-2xl bg-white p-1.5 shadow-sm ring-1 ring-ink-100"
        >
          {TABS.map((tab) => (
            <Link
              key={tab.label}
              to={childPath(studentId, tab.section)}
              aria-current={tab.section === section ? 'page' : undefined}
              className={cn(
                'rounded-xl px-3.5 py-2 text-sm font-medium transition',
                tab.section === section
                  ? 'bg-primary-700 text-white shadow-sm'
                  : 'text-ink-600 hover:bg-ink-100',
              )}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
        {children}
      </PageShell>
    </AppLayout>
  );
}

export function QueryError({
  title,
  message,
  onRetry,
  retrying,
}: {
  title: string;
  message: string;
  onRetry: () => void;
  retrying?: boolean;
}) {
  return (
    <section className="rounded-2xl border border-danger-100 bg-white p-8 text-center shadow-sm">
      <h2 className="font-display font-semibold text-ink-950">{title}</h2>
      <p className="mt-2 text-sm text-ink-600">{message}</p>
      <Button className="mt-4" variant="outline" onClick={onRetry} isLoading={retrying}>
        Try again
      </Button>
    </section>
  );
}
