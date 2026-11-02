import { useState } from 'react';
import { Megaphone } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { EmptyState } from '@/components/ui/empty-state';
import { ListPagination } from '@/components/ui/list-pagination';
import { PageShell } from '@/components/ui/page-shell';
import { Skeleton } from '@/components/ui/skeleton';
import { useTenantDateTime } from '@/hooks/useTenantDateTime';
import { QueryError } from '../components/ChildPageShell';
import { useParentNotices } from '../hooks/useParentPortal';

export function ParentNoticesPage() {
  const { formatDateTime } = useTenantDateTime();
  const [page, setPage] = useState(1);
  const noticesQuery = useParentNotices(page, 10);
  const items = noticesQuery.data?.items ?? [];
  const pagination = noticesQuery.data?.pagination;

  return (
    <AppLayout>
      <PageShell
        eyebrow="Parent portal"
        title="Notices"
        description="Announcements from your school."
      >
        {noticesQuery.isPending ? (
          <div className="space-y-3">
            {[0, 1, 2].map((key) => (
              <Skeleton key={key} className="h-28" />
            ))}
          </div>
        ) : noticesQuery.error ? (
          <QueryError
            title="Failed to load notices"
            message={noticesQuery.error.message}
            onRetry={() => void noticesQuery.refetch()}
            retrying={noticesQuery.isFetching}
          />
        ) : items.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            title="No notices yet"
            description="New announcements from the school will appear here."
          />
        ) : (
          <>
            <div className="space-y-3">
              {items.map((notice) => (
                <article
                  key={notice.id}
                  className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ink-100"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h2 className="font-display text-base font-semibold text-ink-950">
                      {notice.title}
                    </h2>
                    {notice.publishedAt && (
                      <time
                        dateTime={notice.publishedAt}
                        className="text-xs text-ink-500"
                      >
                        {formatDateTime(notice.publishedAt)}
                      </time>
                    )}
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink-700">
                    {notice.body}
                  </p>
                  {notice.createdByName && (
                    <p className="mt-3 text-xs text-ink-400">Posted by {notice.createdByName}</p>
                  )}
                </article>
              ))}
            </div>
            {pagination && (
              <ListPagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                total={pagination.total}
                limit={pagination.limit}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </PageShell>
    </AppLayout>
  );
}
