import { FileText } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { Badge, type BadgeTone } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useTenantDateTime } from '@/hooks/useTenantDateTime';
import { ChildPageShell, QueryError } from '../components/ChildPageShell';
import { useChildResults } from '../hooks/useParentPortal';

const RESULT_TONE: Record<string, BadgeTone> = {
  Pass: 'success',
  Fail: 'danger',
  Incomplete: 'warning',
};

export function ParentResultsPage() {
  const { studentId = '' } = useParams();
  const { formatDate } = useTenantDateTime();
  const resultsQuery = useChildResults(studentId);
  const results = resultsQuery.data?.results ?? [];

  return (
    <ChildPageShell
      studentId={studentId}
      section="results"
      title="Results"
      description="Published exam results and report cards."
    >
      {resultsQuery.isPending ? (
        <div className="space-y-3">
          {[0, 1].map((key) => (
            <Skeleton key={key} className="h-56" />
          ))}
        </div>
      ) : resultsQuery.error ? (
        <QueryError
          title="Failed to load results"
          message={resultsQuery.error.message}
          onRetry={() => void resultsQuery.refetch()}
          retrying={resultsQuery.isFetching}
        />
      ) : results.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No published results"
          description="Results appear here once the school publishes an exam."
        />
      ) : (
        <div className="space-y-4">
          {results.map(({ exam, card }) => (
            <article
              key={exam.id}
              className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-ink-100"
            >
              <header className="flex flex-wrap items-start justify-between gap-3 border-b border-ink-100 px-5 py-4">
                <div className="min-w-0">
                  <h2 className="font-display text-base font-semibold text-ink-950">
                    {exam.name}
                  </h2>
                  <p className="text-xs text-ink-500">
                    {[exam.term, exam.academicYear].filter(Boolean).join(' · ') || 'Exam'}
                    {exam.publishedAt &&
                      ` · Published ${formatDate(exam.publishedAt)}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="font-display text-lg font-semibold text-ink-950"
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                  >
                    {card.totals.obtained}/{card.totals.max} · {card.totals.percentage}%
                  </span>
                  <Badge tone={RESULT_TONE[card.totals.result] ?? 'neutral'}>
                    {card.totals.result}
                  </Badge>
                </div>
              </header>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-ink-100 bg-surface-muted/90 text-xs uppercase tracking-wide text-ink-500">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Subject</th>
                      <th className="px-5 py-3 text-right font-semibold">Marks</th>
                      <th className="px-5 py-3 text-right font-semibold">Max</th>
                      <th className="px-5 py-3 text-right font-semibold">Pass</th>
                      <th className="px-5 py-3 font-semibold">Result</th>
                    </tr>
                  </thead>
                  <tbody
                    className="divide-y divide-ink-100"
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                  >
                    {card.subjects.map((subject) => (
                      <tr key={subject.examSubjectId}>
                        <td className="px-5 py-3 font-medium text-ink-900">
                          {subject.subjectName}
                        </td>
                        <td className="px-5 py-3 text-right text-ink-900">
                          {subject.isAbsent ? 'Absent' : (subject.marksObtained ?? '—')}
                        </td>
                        <td className="px-5 py-3 text-right text-ink-600">{subject.maxMarks}</td>
                        <td className="px-5 py-3 text-right text-ink-600">{subject.passMarks}</td>
                        <td className="px-5 py-3">
                          {subject.isAbsent ? (
                            <Badge tone="warning">Absent</Badge>
                          ) : subject.marksObtained === null ? (
                            <Badge tone="neutral">Pending</Badge>
                          ) : (
                            <Badge tone={subject.passed ? 'success' : 'danger'}>
                              {subject.passed ? 'Pass' : 'Fail'}
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          ))}
        </div>
      )}
    </ChildPageShell>
  );
}
