import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, ClipboardList, DollarSign } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { DateInput } from '@/components/ui/date-input';
import { EmptyState } from '@/components/ui/empty-state';
import { FilterField, FiltersPanel } from '@/components/ui/filters-panel';
import { PageShell } from '@/components/ui/page-shell';
import { PageLoader } from '@/components/ui/spinner';
import { StatCard } from '@/components/ui/stat-card';
import { useClasses } from '@/features/school/classes/hooks/useClasses';
import { useSections } from '@/features/school/classes/hooks/useSections';
import { useExams } from '@/features/school/exams/hooks/useExams';
import { usePermission } from '@/hooks/usePermission';
import { useTenantDateTime } from '@/hooks/useTenantDateTime';
import {
  useAcademicReport,
  useAttendanceReport,
  useFeesReport,
} from '../hooks/useReports';

type Tab = 'fees' | 'attendance' | 'academic';

function money(value: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(value);
}

export function ReportsPage() {
  const { can } = usePermission();
  const { todayIso } = useTenantDateTime();
  const monthStart = () => `${todayIso().slice(0, 7)}-01`;
  const canFees = can('reports.fees') || can('fees.invoice.read');
  const canAttendance =
    can('reports.attendance') || can('attendance.read') || can('attendance.report');
  const canAcademic =
    can('reports.academic') ||
    can('exams.result.publish') ||
    can('exams.reportcard.generate');

  const availableTabs = useMemo(() => {
    const tabs: Tab[] = [];
    if (canFees) tabs.push('fees');
    if (canAttendance) tabs.push('attendance');
    if (canAcademic) tabs.push('academic');
    return tabs;
  }, [canFees, canAttendance, canAcademic]);

  const [tab, setTab] = useState<Tab>(availableTabs[0] ?? 'fees');
  const [from, setFrom] = useState(() => monthStart());
  const [to, setTo] = useState(() => todayIso());
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [examId, setExamId] = useState('');

  const [defaultFrom] = useState(() => monthStart());
  const [defaultTo] = useState(() => todayIso());
  const dateFiltersActive =
    (tab === 'fees' || tab === 'attendance') &&
    (from !== defaultFrom || to !== defaultTo);
  const filtersActive =
    dateFiltersActive ||
    Boolean(classId) ||
    (tab === 'attendance' && Boolean(sectionId)) ||
    (tab === 'academic' && Boolean(examId));

  const clearFilters = () => {
    setFrom(defaultFrom);
    setTo(defaultTo);
    setClassId('');
    setSectionId('');
    setExamId('');
  };

  const classesQuery = useClasses();
  const sectionsQuery = useSections(classId);
  const examsQuery = useExams(
    { page: 1, limit: 50, classId: classId || undefined },
    { enabled: canAcademic && tab === 'academic' },
  );

  const feesQuery = useFeesReport(
    {
      from,
      to,
      classId: classId || undefined,
    },
    tab === 'fees' && canFees,
  );
  const attendanceQuery = useAttendanceReport(
    {
      from,
      to,
      classId: classId || undefined,
      sectionId: sectionId || undefined,
    },
    tab === 'attendance' && canAttendance,
  );
  const academicQuery = useAcademicReport(
    {
      examId: examId || undefined,
      classId: classId || undefined,
    },
    tab === 'academic' && canAcademic,
  );

  if (availableTabs.length === 0) {
    return (
      <AppLayout>
        <EmptyState
          icon={BarChart3}
          title="No report access"
          description="Ask an administrator for reports permissions."
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageShell
        eyebrow="Insights"
        title="Reports"
        description="Fees, attendance, and academic summaries for your school."
      >
        <div className="flex flex-wrap gap-2 border-b border-ink-200">
          {canFees && (
            <TabButton active={tab === 'fees'} onClick={() => setTab('fees')}>
              Fees
            </TabButton>
          )}
          {canAttendance && (
            <TabButton active={tab === 'attendance'} onClick={() => setTab('attendance')}>
              Attendance
            </TabButton>
          )}
          {canAcademic && (
            <TabButton active={tab === 'academic'} onClick={() => setTab('academic')}>
              Academic
            </TabButton>
          )}
        </div>

        <FiltersPanel
          description="Narrow the report by date range, class, or exam."
          onClear={clearFilters}
          clearDisabled={!filtersActive}
        >
          {(tab === 'fees' || tab === 'attendance') && (
            <>
              <FilterField id="report-from" label="From" className="md:col-span-3">
                <DateInput
                  id="report-from"
                  className="text-[13px]"
                  value={from}
                  onChange={setFrom}
                />
              </FilterField>
              <FilterField id="report-to" label="To" className="md:col-span-3">
                <DateInput
                  id="report-to"
                  className="text-[13px]"
                  value={to}
                  onChange={setTo}
                />
              </FilterField>
            </>
          )}
          <FilterField id="report-class" label="Class" className="md:col-span-3">
            <select
              id="report-class"
              className="field-select w-full text-[13px]"
              value={classId}
              onChange={(event) => {
                setClassId(event.target.value);
                setSectionId('');
                setExamId('');
              }}
            >
              <option value="">All classes</option>
              {(classesQuery.data ?? []).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </FilterField>
          {tab === 'attendance' && (
            <FilterField id="report-section" label="Section" className="md:col-span-3">
              <select
                id="report-section"
                className="field-select w-full text-[13px]"
                value={sectionId}
                disabled={!classId}
                onChange={(event) => setSectionId(event.target.value)}
              >
                <option value="">All sections</option>
                {(sectionsQuery.data ?? []).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </FilterField>
          )}
          {tab === 'academic' && (
            <FilterField id="report-exam" label="Exam" className="md:col-span-6">
              <select
                id="report-exam"
                className="field-select w-full text-[13px]"
                value={examId}
                onChange={(event) => setExamId(event.target.value)}
              >
                <option value="">Latest exam</option>
                {(examsQuery.data?.items ?? []).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} · {item.className}
                  </option>
                ))}
              </select>
            </FilterField>
          )}
        </FiltersPanel>

        {tab === 'fees' && (
          <FeesReportView query={feesQuery} />
        )}
        {tab === 'attendance' && (
          <AttendanceReportView query={attendanceQuery} />
        )}
        {tab === 'academic' && (
          <AcademicReportView query={academicQuery} />
        )}
      </PageShell>
    </AppLayout>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border-b-2 px-4 py-2.5 text-sm font-medium transition ${
        active
          ? 'border-primary-600 text-primary-700'
          : 'border-transparent text-ink-500 hover:text-ink-900'
      }`}
    >
      {children}
    </button>
  );
}

function FeesReportView({
  query,
}: {
  query: ReturnType<typeof useFeesReport>;
}) {
  if (query.isPending) {
    return (
      <div className="panel">
        <PageLoader compact />
      </div>
    );
  }
  if (query.error) {
    return (
      <div className="rounded-2xl border border-danger-100 bg-danger-50 p-6 text-sm text-danger-700">
        {query.error.message}
      </div>
    );
  }
  const data = query.data;
  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Invoices" value={data.summary.invoiceCount} icon={ClipboardList} />
        <StatCard label="Billed" value={money(data.summary.billed)} icon={DollarSign} />
        <StatCard
          label="Payments in range"
          value={money(data.summary.paymentsInRange)}
          hint={`${data.summary.paymentCount} payments`}
          icon={DollarSign}
        />
        <StatCard label="Outstanding" value={money(data.summary.outstanding)} icon={DollarSign} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="panel overflow-hidden p-0">
          <div className="border-b border-ink-100 px-5 py-3">
            <h2 className="font-semibold text-ink-950">By status</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-ink-100 text-xs uppercase text-ink-500">
                <tr>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Count</th>
                  <th className="px-5 py-3">Billed</th>
                  <th className="px-5 py-3">Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {data.byStatus.map((row) => (
                  <tr key={row.status}>
                    <td className="px-5 py-3 capitalize">{row.status}</td>
                    <td className="px-5 py-3">{row.count}</td>
                    <td className="px-5 py-3">{money(row.amount)}</td>
                    <td className="px-5 py-3">{money(row.paid)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel overflow-hidden p-0">
          <div className="border-b border-ink-100 px-5 py-3">
            <h2 className="font-semibold text-ink-950">By class</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-ink-100 text-xs uppercase text-ink-500">
                <tr>
                  <th className="px-5 py-3">Class</th>
                  <th className="px-5 py-3">Count</th>
                  <th className="px-5 py-3">Outstanding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {data.byClass.map((row) => (
                  <tr key={row.classId}>
                    <td className="px-5 py-3">{row.className}</td>
                    <td className="px-5 py-3">{row.count}</td>
                    <td className="px-5 py-3">{money(row.outstanding)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function AttendanceReportView({
  query,
}: {
  query: ReturnType<typeof useAttendanceReport>;
}) {
  if (query.isPending) {
    return (
      <div className="panel">
        <PageLoader compact />
      </div>
    );
  }
  if (query.error) {
    return (
      <div className="rounded-2xl border border-danger-100 bg-danger-50 p-6 text-sm text-danger-700">
        {query.error.message}
      </div>
    );
  }
  const data = query.data;
  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Present rate" value={`${data.summary.presentRate}%`} />
        <StatCard label="Present" value={data.summary.present} />
        <StatCard label="Absent" value={data.summary.absent} />
        <StatCard label="Late" value={data.summary.late} />
        <StatCard label="Leave" value={data.summary.leave} />
      </div>

      <section className="panel overflow-hidden p-0">
        <div className="border-b border-ink-100 px-5 py-3">
          <h2 className="font-semibold text-ink-950">By section</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-ink-100 text-xs uppercase text-ink-500">
              <tr>
                <th className="px-5 py-3">Class / section</th>
                <th className="px-5 py-3">Present</th>
                <th className="px-5 py-3">Absent</th>
                <th className="px-5 py-3">Late</th>
                <th className="px-5 py-3">Leave</th>
                <th className="px-5 py-3">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {data.bySection.map((row) => (
                <tr key={row.sectionId}>
                  <td className="px-5 py-3">
                    {row.className} · {row.sectionName}
                  </td>
                  <td className="px-5 py-3">{row.present}</td>
                  <td className="px-5 py-3">{row.absent}</td>
                  <td className="px-5 py-3">{row.late}</td>
                  <td className="px-5 py-3">{row.leave}</td>
                  <td className="px-5 py-3">{row.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function AcademicReportView({
  query,
}: {
  query: ReturnType<typeof useAcademicReport>;
}) {
  const { formatDate } = useTenantDateTime();
  if (query.isPending) {
    return (
      <div className="panel">
        <PageLoader compact />
      </div>
    );
  }
  if (query.error) {
    return (
      <div className="rounded-2xl border border-danger-100 bg-danger-50 p-6 text-sm text-danger-700">
        {query.error.message}
      </div>
    );
  }
  const data = query.data;
  if (!data?.exam) {
    return (
      <EmptyState
        icon={BarChart3}
        title="No exams found"
        description="Create and mark an exam to see academic summaries."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="panel flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <div className="mb-2 flex flex-wrap gap-2">
            <Badge tone="primary">{data.exam.className}</Badge>
            <Badge tone="neutral">{data.exam.status.replace('_', ' ')}</Badge>
          </div>
          <h2 className="font-display text-lg font-semibold text-ink-950">{data.exam.name}</h2>
          <p className="mt-1 text-sm text-ink-500">
            {formatDate(data.exam.startDate)} → {formatDate(data.exam.endDate)}
            {data.exam.term ? ` · ${data.exam.term}` : ''}
          </p>
        </div>
        <Link
          to={`/exams/${data.exam.id}/report-cards`}
          className="inline-flex h-10 items-center rounded-xl bg-primary-700 px-4 text-sm font-semibold text-white hover:bg-primary-800"
        >
          Open report cards
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Students scored" value={data.summary.studentCount} />
        <StatCard label="Average %" value={data.summary.averagePercentage} />
        <StatCard label="Pass" value={data.summary.passCount} />
        <StatCard label="Fail" value={data.summary.failCount} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="panel overflow-hidden p-0">
          <div className="border-b border-ink-100 px-5 py-3">
            <h3 className="font-semibold text-ink-950">Subject averages</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-ink-100 text-xs uppercase text-ink-500">
                <tr>
                  <th className="px-5 py-3">Subject</th>
                  <th className="px-5 py-3">Average</th>
                  <th className="px-5 py-3">Marked</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {data.subjectAverages.map((row) => (
                  <tr key={row.examSubjectId}>
                    <td className="px-5 py-3">{row.subjectName}</td>
                    <td className="px-5 py-3">
                      {row.average} / {row.maxMarks}
                    </td>
                    <td className="px-5 py-3">{row.markedCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel overflow-hidden p-0">
          <div className="border-b border-ink-100 px-5 py-3">
            <h3 className="font-semibold text-ink-950">Top students</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-ink-100 text-xs uppercase text-ink-500">
                <tr>
                  <th className="px-5 py-3">Student</th>
                  <th className="px-5 py-3">%</th>
                  <th className="px-5 py-3">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {data.topStudents.map((row) => (
                  <tr key={row.studentId}>
                    <td className="px-5 py-3">
                      <span className="font-medium text-ink-950">{row.fullName}</span>
                      <span className="mt-0.5 block text-xs text-ink-500">
                        {row.sectionName} · {row.admissionNo}
                      </span>
                    </td>
                    <td className="px-5 py-3">{row.percentage}%</td>
                    <td className="px-5 py-3">
                      <Badge tone={row.passed ? 'success' : 'danger'}>
                        {row.passed ? 'Pass' : 'Fail'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
