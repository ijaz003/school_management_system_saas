import { GraduationCap, Megaphone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { MetricCard, MetricGrid } from '@/components/ui/metric-card';
import { PageShell } from '@/components/ui/page-shell';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppSelector } from '@/store/hooks';
import { selectUser } from '@/store/selectors/permissions';
import { QueryError } from '../components/ChildPageShell';
import { useParentChildren } from '../hooks/useParentPortal';
import { childPath } from '../paths';

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export function ParentHomePage() {
  const user = useAppSelector(selectUser);
  const childrenQuery = useParentChildren();
  const children = childrenQuery.data ?? [];

  return (
    <AppLayout>
      <PageShell
        eyebrow="Parent portal"
        title={user ? `Welcome, ${user.fullName.split(' ')[0]}` : 'Welcome'}
        description="Follow your children’s attendance, fees, daily diary, and results."
        actions={
          <Link to="/parent/notices">
            <Button variant="outline">
              <Megaphone className="h-4 w-4" aria-hidden="true" /> School notices
            </Button>
          </Link>
        }
      >
        {childrenQuery.data && (
          <MetricGrid>
            <MetricCard
              icon={<GraduationCap className="h-4 w-4" aria-hidden="true" />}
              label="Linked children"
              value={children.length}
              tone="primary"
            />
          </MetricGrid>
        )}

        {childrenQuery.isPending ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((key) => (
              <Skeleton key={key} className="h-44" />
            ))}
          </div>
        ) : childrenQuery.error ? (
          <QueryError
            title="Failed to load your children"
            message={childrenQuery.error.message}
            onRetry={() => void childrenQuery.refetch()}
            retrying={childrenQuery.isFetching}
          />
        ) : children.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="No children linked yet"
            description="Ask the school office to link your children to your parent account."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {children.map((child) => (
              <article
                key={child.id}
                className="flex flex-col rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ink-100 transition hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-700 text-sm font-bold text-white">
                    {initials(child.fullName)}
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate font-display text-base font-semibold text-ink-950">
                      {child.fullName}
                    </h2>
                    <p className="truncate text-xs text-ink-500">
                      {child.className} · {child.sectionName}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge tone="neutral" className="font-mono normal-case">
                    {child.admissionNo}
                  </Badge>
                  <Badge tone={child.status === 'active' ? 'success' : 'neutral'}>
                    {child.status}
                  </Badge>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <Link to={childPath(child.id)} className="col-span-2">
                    <Button className="w-full">Open overview</Button>
                  </Link>
                  <Link to={childPath(child.id, 'attendance')}>
                    <Button variant="outline" size="sm" className="w-full">
                      Attendance
                    </Button>
                  </Link>
                  <Link to={childPath(child.id, 'fees')}>
                    <Button variant="outline" size="sm" className="w-full">
                      Fees
                    </Button>
                  </Link>
                  <Link to={childPath(child.id, 'diary')}>
                    <Button variant="outline" size="sm" className="w-full">
                      Diary
                    </Button>
                  </Link>
                  <Link to={childPath(child.id, 'results')}>
                    <Button variant="outline" size="sm" className="w-full">
                      Results
                    </Button>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </PageShell>
    </AppLayout>
  );
}
