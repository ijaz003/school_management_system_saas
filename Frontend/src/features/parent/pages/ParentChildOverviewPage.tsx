import {
  BookMarked,
  CalendarCheck,
  CalendarClock,
  CalendarX,
  DollarSign,
  FileText,
  Wallet,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { MetricCard, MetricGrid } from '@/components/ui/metric-card';
import { ChildPageShell } from '../components/ChildPageShell';
import { useChildAttendance, useChildFees, useParentChildren } from '../hooks/useParentPortal';
import { childPath, type ChildSection } from '../paths';

const LINKS: Array<{
  section: ChildSection;
  label: string;
  description: string;
  icon: typeof CalendarCheck;
}> = [
  { section: 'attendance', label: 'Attendance', description: 'Daily presence record', icon: CalendarCheck },
  { section: 'fees', label: 'Fees', description: 'Invoices and balances', icon: DollarSign },
  { section: 'diary', label: 'Daily diary', description: 'Classwork and homework', icon: BookMarked },
  { section: 'timetable', label: 'Timetable', description: 'Weekly class schedule', icon: CalendarClock },
  { section: 'results', label: 'Results', description: 'Published exam results', icon: FileText },
];

function formatAmount(value: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(value);
}

export function ParentChildOverviewPage() {
  const { studentId = '' } = useParams();
  const childrenQuery = useParentChildren();
  const child = childrenQuery.data?.find((item) => item.id === studentId);
  const attendanceQuery = useChildAttendance(studentId, {});
  const feesQuery = useChildFees(studentId, 1, 100);

  const summary = attendanceQuery.data?.summary;
  const rate =
    summary && summary.total > 0
      ? `${Math.round(((summary.present + summary.late) / summary.total) * 100)}%`
      : '—';
  const outstanding = feesQuery.data?.items.reduce((sum, invoice) => sum + invoice.balance, 0);

  return (
    <ChildPageShell
      studentId={studentId}
      section=""
      title={child?.fullName ?? 'Overview'}
      description={
        child
          ? `Admission no. ${child.admissionNo} · ${child.className} ${child.sectionName}`
          : undefined
      }
    >
      <MetricGrid>
        <MetricCard
          icon={<CalendarCheck className="h-4 w-4" aria-hidden="true" />}
          label="Attendance (30 days)"
          value={attendanceQuery.isPending ? '…' : rate}
          tone="primary"
        />
        <MetricCard
          icon={<CalendarX className="h-4 w-4" aria-hidden="true" />}
          label="Absences (30 days)"
          value={attendanceQuery.isPending ? '…' : (summary?.absent ?? 0)}
          tone="warning"
        />
        <MetricCard
          icon={<Wallet className="h-4 w-4" aria-hidden="true" />}
          label="Outstanding fees"
          value={feesQuery.isPending ? '…' : formatAmount(outstanding ?? 0)}
          tone={outstanding ? 'danger' : 'success'}
        />
        <MetricCard
          icon={<DollarSign className="h-4 w-4" aria-hidden="true" />}
          label="Invoices"
          value={feesQuery.isPending ? '…' : (feesQuery.data?.pagination.total ?? 0)}
        />
      </MetricGrid>

      <div className="grid gap-4 sm:grid-cols-2">
        {LINKS.map((item) => (
          <Link
            key={item.section}
            to={childPath(studentId, item.section)}
            className="group flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ink-100 transition hover:shadow-md hover:ring-primary-200"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
              <item.icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block font-display text-base font-semibold text-ink-950 group-hover:text-primary-800">
                {item.label}
              </span>
              <span className="block text-sm text-ink-500">{item.description}</span>
            </span>
          </Link>
        ))}
      </div>
    </ChildPageShell>
  );
}
