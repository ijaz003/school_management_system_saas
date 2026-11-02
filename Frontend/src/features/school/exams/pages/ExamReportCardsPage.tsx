import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Printer } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { PageLoader } from '@/components/ui/spinner';
import { api } from '@/lib/api';
import { usePermission } from '@/hooks/usePermission';
import { useTenantDateTime } from '@/hooks/useTenantDateTime';

interface ReportCard {
  school: {
    name: string;
    city: string | null;
    address: string | null;
    logoUrl: string | null;
  };
  exam: {
    id: string;
    name: string;
    className: string;
    term: string | null;
    academicYear: string | null;
    startDate: string;
    endDate: string;
    status: string;
  };
  student: {
    id: string;
    fullName: string;
    admissionNo: string;
    sectionName: string;
  };
  subjects: Array<{
    examSubjectId: string;
    subjectName: string;
    maxMarks: number;
    passMarks: number;
    marksObtained: number | null;
    isAbsent: boolean;
    passed: boolean;
  }>;
  totals: {
    obtained: number;
    max: number;
    percentage: number;
    absentCount: number;
    result: string;
  };
  generatedAt: string;
}

export function ExamReportCardsPage() {
  const { id } = useParams<{ id: string }>();
  const { can } = usePermission();
  const canView =
    can('exams.reportcard.generate') || can('exams.result.publish');
  const [selectedStudentId, setSelectedStudentId] = useState('');

  const cardsQuery = useQuery({
    queryKey: ['exams', id, 'report-cards'],
    enabled: Boolean(id) && canView,
    queryFn: async () => {
      const response = await api.get<{
        exam: { id: string; name: string; className: string; status: string };
        cards: ReportCard[];
      }>(`/school/exams/${id}/report-cards`);
      if (!response.data) throw new Error('Report cards unavailable');
      return response.data;
    },
  });

  const cards = cardsQuery.data?.cards ?? [];
  const selectedCard = useMemo(() => {
    if (!selectedStudentId) return cards[0] ?? null;
    return cards.find((card) => card.student.id === selectedStudentId) ?? null;
  }, [cards, selectedStudentId]);

  if (!canView) {
    return (
      <AppLayout>
        <EmptyState
          title="No access"
          description="You need report card permission to view this page."
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 print:space-y-0">
        <div className="print:hidden">
          <Link
            to={`/exams/${id}`}
            className="mb-4 inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-900"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to exam
          </Link>
          <PageHeader
            eyebrow="Exams"
            title="Report cards"
            description={
              cardsQuery.data
                ? `${cardsQuery.data.exam.name} · ${cardsQuery.data.exam.className}`
                : 'Printable student result sheets'
            }
            actions={
              <Button
                type="button"
                variant="outline"
                onClick={() => window.print()}
                disabled={!selectedCard}
              >
                <Printer className="h-4 w-4" aria-hidden="true" /> Print
              </Button>
            }
          />
        </div>

        {cardsQuery.isPending ? (
          <div className="panel print:hidden">
            <PageLoader compact />
          </div>
        ) : cardsQuery.error ? (
          <div className="rounded-2xl border border-danger-100 bg-danger-50 p-6 text-sm text-danger-700 print:hidden">
            {cardsQuery.error.message}
          </div>
        ) : cards.length === 0 ? (
          <EmptyState
            title="No report cards yet"
            description="Enter marks for students in this exam first."
          />
        ) : (
          <>
            <section className="panel p-4 print:hidden">
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-ink-800">Student</span>
                <select
                  className="field-select max-w-xl"
                  value={selectedCard?.student.id ?? ''}
                  onChange={(event) => setSelectedStudentId(event.target.value)}
                >
                  {cards.map((card) => (
                    <option key={card.student.id} value={card.student.id}>
                      {card.student.fullName} ({card.student.admissionNo})
                    </option>
                  ))}
                </select>
              </label>
            </section>

            {selectedCard && <ReportCardSheet card={selectedCard} />}
          </>
        )}
      </div>
    </AppLayout>
  );
}

function ReportCardSheet({ card }: { card: ReportCard }) {
  const { formatDateTime } = useTenantDateTime();
  return (
    <article className="panel mx-auto max-w-3xl overflow-hidden p-6 sm:p-8 print:max-w-none print:border-0 print:p-0 print:shadow-none">
      <header className="border-b border-ink-200 pb-5 text-center">
        <p className="font-display text-2xl font-semibold text-ink-950">{card.school.name}</p>
        {(card.school.city || card.school.address) && (
          <p className="mt-1 text-sm text-ink-500">
            {[card.school.address, card.school.city].filter(Boolean).join(' · ')}
          </p>
        )}
        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-primary-700">
          Student report card
        </p>
      </header>

      <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <p className="text-ink-500">Student</p>
          <p className="font-semibold text-ink-950">{card.student.fullName}</p>
          <p className="text-ink-600">
            {card.student.admissionNo} · Section {card.student.sectionName}
          </p>
        </div>
        <div className="sm:text-right">
          <p className="text-ink-500">Exam</p>
          <p className="font-semibold text-ink-950">{card.exam.name}</p>
          <p className="text-ink-600">
            {card.exam.className}
            {card.exam.term ? ` · ${card.exam.term}` : ''}
            {card.exam.academicYear ? ` · ${card.exam.academicYear}` : ''}
          </p>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-y border-ink-200 text-xs uppercase tracking-wide text-ink-500">
            <tr>
              <th className="py-3 pr-3 font-semibold">Subject</th>
              <th className="px-3 py-3 font-semibold">Max</th>
              <th className="px-3 py-3 font-semibold">Pass</th>
              <th className="px-3 py-3 font-semibold">Obtained</th>
              <th className="py-3 pl-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {card.subjects.map((subject) => (
              <tr key={subject.examSubjectId}>
                <td className="py-3 pr-3 font-medium text-ink-950">{subject.subjectName}</td>
                <td className="px-3 py-3">{subject.maxMarks}</td>
                <td className="px-3 py-3">{subject.passMarks}</td>
                <td className="px-3 py-3">
                  {subject.isAbsent ? 'Absent' : (subject.marksObtained ?? '—')}
                </td>
                <td className="py-3 pl-3">
                  <Badge
                    tone={
                      subject.isAbsent
                        ? 'warning'
                        : subject.marksObtained === null
                          ? 'neutral'
                          : subject.passed
                            ? 'success'
                            : 'danger'
                    }
                  >
                    {subject.isAbsent
                      ? 'Absent'
                      : subject.marksObtained === null
                        ? '—'
                        : subject.passed
                          ? 'Pass'
                          : 'Fail'}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <footer className="mt-6 grid gap-3 border-t border-ink-200 pt-5 text-sm sm:grid-cols-4">
        <div>
          <p className="text-ink-500">Total</p>
          <p className="font-semibold text-ink-950">
            {card.totals.obtained} / {card.totals.max}
          </p>
        </div>
        <div>
          <p className="text-ink-500">Percentage</p>
          <p className="font-semibold text-ink-950">{card.totals.percentage}%</p>
        </div>
        <div>
          <p className="text-ink-500">Result</p>
          <Badge
            tone={
              card.totals.result === 'Pass'
                ? 'success'
                : card.totals.result === 'Fail'
                  ? 'danger'
                  : 'warning'
            }
          >
            {card.totals.result}
          </Badge>
        </div>
        <div className="sm:text-right">
          <p className="text-ink-500">Generated</p>
          <p className="text-ink-700">{formatDateTime(card.generatedAt)}</p>
        </div>
      </footer>
    </article>
  );
}
