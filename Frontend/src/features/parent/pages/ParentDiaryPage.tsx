import { useState } from 'react';
import { BookMarked } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { EmptyState } from '@/components/ui/empty-state';
import { ListPagination } from '@/components/ui/list-pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { useTenantDateTime } from '@/hooks/useTenantDateTime';
import { ChildPageShell, QueryError } from '../components/ChildPageShell';
import { useChildDiary } from '../hooks/useParentPortal';

function DiarySection({ label, text }: { label: string; text: string | null }) {
  if (!text) return null;
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-ink-800">{text}</p>
    </div>
  );
}

export function ParentDiaryPage() {
  const { studentId = '' } = useParams();
  const { formatDate } = useTenantDateTime();
  const [pageState, setPageState] = useState({ studentId, page: 1 });
  // Pagination resets whenever the child changes.
  const page = pageState.studentId === studentId ? pageState.page : 1;
  const setPage = (next: number) => setPageState({ studentId, page: next });
  const diaryQuery = useChildDiary(studentId, page, 10);
  const items = diaryQuery.data?.items ?? [];
  const pagination = diaryQuery.data?.pagination;

  return (
    <ChildPageShell
      studentId={studentId}
      section="diary"
      title="Daily diary"
      description="Classwork, homework, and teacher remarks."
    >
      {diaryQuery.isPending ? (
        <div className="space-y-3">
          {[0, 1, 2].map((key) => (
            <Skeleton key={key} className="h-32" />
          ))}
        </div>
      ) : diaryQuery.error ? (
        <QueryError
          title="Failed to load diary"
          message={diaryQuery.error.message}
          onRetry={() => void diaryQuery.refetch()}
          retrying={diaryQuery.isFetching}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={BookMarked}
          title="No diary entries"
          description="Published diary entries for this class will appear here."
        />
      ) : (
        <>
          <div className="space-y-3">
            {items.map((entry) => (
              <article
                key={entry.id}
                className="space-y-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ink-100"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h2 className="font-display text-base font-semibold text-ink-950">
                    {entry.title}
                  </h2>
                  <time className="text-xs text-ink-500">
                    {formatDate(entry.entryDate)}
                  </time>
                </div>
                <DiarySection label="Classwork" text={entry.classwork} />
                <DiarySection label="Homework" text={entry.homework} />
                <DiarySection label="Remarks" text={entry.remarks} />
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
    </ChildPageShell>
  );
}
