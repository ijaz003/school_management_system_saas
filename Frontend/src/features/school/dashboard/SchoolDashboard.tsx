import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  CalendarCheck,
  ClipboardList,
  DollarSign,
  GraduationCap,
  Megaphone,
  Users,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Skeleton } from '@/components/ui/skeleton';
import { usePermission } from '@/hooks/usePermission';
import { useAppSelector } from '@/store/hooks';
import { selectUser } from '@/store/selectors/permissions';
import { useDashboardStats } from './hooks/useDashboardStats';

function formatMoney(amount: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(amount);
}

export function SchoolDashboard() {
  const user = useAppSelector(selectUser);
  const { can } = usePermission();
  const firstName = user?.fullName.split(' ')[0] || 'there';
  const statsQuery = useDashboardStats(true);
  const stats = statsQuery.data;

  const quickActions = [
    can('students.create') && {
      label: 'Add student',
      to: '/students/new',
      icon: GraduationCap,
    },
    can('attendance.mark') && {
      label: 'Mark attendance',
      to: '/attendance',
      icon: CalendarCheck,
    },
    can('fees.invoice.create') && {
      label: 'Create invoice',
      to: '/fees',
      icon: DollarSign,
    },
    can('exams.schedule.create') && {
      label: 'Schedule exam',
      to: '/exams',
      icon: ClipboardList,
    },
    can('notices.send') && {
      label: 'New notice',
      to: '/notices',
      icon: Megaphone,
    },
    (can('reports.fees') || can('fees.invoice.read')) && {
      label: 'View reports',
      to: '/reports',
      icon: ClipboardList,
    },
  ].filter(Boolean) as Array<{
    label: string;
    to: string;
    icon: typeof GraduationCap;
  }>;

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Overview"
          title={`Welcome back, ${firstName}`}
          description={new Date().toLocaleDateString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Active students"
            value={stats?.students.active ?? 0}
            hint="Currently enrolled"
            icon={GraduationCap}
            loading={statsQuery.isPending}
          />
          <StatCard
            label="Teachers"
            value={stats?.teachers.active ?? 0}
            hint="Active teacher accounts"
            icon={Users}
            loading={statsQuery.isPending}
          />
          <StatCard
            label="Present today"
            value={stats?.attendanceToday.present ?? 0}
            hint={
              stats
                ? `${stats.attendanceToday.marked} marks recorded`
                : 'Attendance marks today'
            }
            icon={CalendarCheck}
            loading={statsQuery.isPending}
          />
          <StatCard
            label="Fees collected (month)"
            value={stats ? formatMoney(stats.fees.collectedThisMonth) : 0}
            hint={
              stats
                ? `${stats.fees.openInvoices} open · ${formatMoney(stats.fees.outstandingBalance)} due`
                : 'This month'
            }
            icon={DollarSign}
            loading={statsQuery.isPending}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-5">
          <section className="panel p-5 lg:col-span-2">
            <h2 className="font-display text-base font-semibold text-ink-950">Quick actions</h2>
            <p className="mt-0.5 text-sm text-ink-500">Jump into common daily tasks.</p>
            {quickActions.length === 0 ? (
              <p className="mt-6 text-sm text-ink-500">No actions available for your role.</p>
            ) : (
              <ul className="mt-4 space-y-2">
                {quickActions.map((action) => (
                  <li key={action.to + action.label}>
                    <Link
                      to={action.to}
                      className="group flex items-center justify-between rounded-xl border border-ink-100 bg-surface-muted/60 px-3 py-2.5 transition hover:border-primary-200 hover:bg-primary-50/50"
                    >
                      <span className="flex items-center gap-3 text-sm font-medium text-ink-800">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-primary-700 shadow-sm ring-1 ring-ink-100">
                          <action.icon className="h-4 w-4" aria-hidden="true" />
                        </span>
                        {action.label}
                      </span>
                      <ArrowUpRight className="h-4 w-4 text-ink-300 transition group-hover:text-primary-700" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="panel p-5 lg:col-span-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-base font-semibold text-ink-950">
                  Recent notices
                </h2>
                <p className="mt-0.5 text-sm text-ink-500">Latest published school announcements.</p>
              </div>
              {can('notices.read') && (
                <Link
                  to="/notices"
                  className="inline-flex h-8 items-center rounded-lg border border-ink-200 bg-white px-3 text-xs font-semibold text-ink-700 transition hover:bg-ink-50"
                >
                  View all
                </Link>
              )}
            </div>

            {statsQuery.isPending ? (
              <div className="mt-4 space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : statsQuery.error ? (
              <div className="mt-6 rounded-xl border border-danger-100 bg-danger-50 px-4 py-3 text-sm text-danger-700">
                {statsQuery.error.message}
              </div>
            ) : (stats?.notices.recent.length ?? 0) === 0 ? (
              <div className="mt-8 rounded-xl border border-dashed border-ink-200 px-4 py-10 text-center">
                <Megaphone className="mx-auto h-8 w-8 text-ink-300" aria-hidden="true" />
                <p className="mt-2 text-sm font-medium text-ink-800">No published notices yet</p>
              </div>
            ) : (
              <ul className="mt-4 divide-y divide-ink-100">
                {stats?.notices.recent.map((notice) => (
                  <li key={notice.id} className="flex items-start justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink-950">{notice.title}</p>
                      <p className="mt-0.5 line-clamp-1 text-sm text-ink-500">{notice.body}</p>
                    </div>
                    <span className="shrink-0 text-xs text-ink-400">
                      {notice.publishedAt
                        ? new Date(notice.publishedAt).toLocaleDateString()
                        : '—'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </AppLayout>
  );
}
