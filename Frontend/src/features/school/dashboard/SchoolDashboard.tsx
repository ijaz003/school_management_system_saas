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
import { useStudents } from '@/features/school/students/hooks/useStudents';
import { useTeachers } from '@/features/school/teachers/hooks/useTeachers';
import { useInvoices } from '@/features/school/fees/hooks/useFees';
import { useNotices } from '@/features/school/notices/hooks/useNotices';

export function SchoolDashboard() {
  const user = useAppSelector(selectUser);
  const { can } = usePermission();
  const firstName = user?.fullName.split(' ')[0] || 'there';

  const studentsEnabled = can('students.read');
  const teachersEnabled = can('teachers.read');
  const feesEnabled = can('fees.invoice.read');
  const noticesEnabled = can('notices.read');

  const studentsQuery = useStudents(
    { page: 1, limit: 1, status: 'active' },
    { enabled: studentsEnabled },
  );
  const teachersQuery = useTeachers({ page: 1, limit: 1 }, { enabled: teachersEnabled });
  const pendingFeesQuery = useInvoices(
    { page: 1, limit: 1, status: 'issued' },
    { enabled: feesEnabled },
  );
  const partialFeesQuery = useInvoices(
    { page: 1, limit: 1, status: 'partial' },
    { enabled: feesEnabled },
  );
  const noticesQuery = useNotices(
    { page: 1, limit: 5, status: 'published' },
    { enabled: noticesEnabled },
  );

  const pendingFeesTotal =
    (pendingFeesQuery.data?.pagination.total ?? 0) +
    (partialFeesQuery.data?.pagination.total ?? 0);

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
            value={studentsEnabled ? (studentsQuery.data?.pagination.total ?? 0) : '—'}
            hint={studentsEnabled ? 'Currently enrolled' : 'No access'}
            icon={GraduationCap}
            loading={studentsEnabled && studentsQuery.isPending}
          />
          <StatCard
            label="Teachers"
            value={teachersEnabled ? (teachersQuery.data?.pagination.total ?? 0) : '—'}
            hint={teachersEnabled ? 'Staff with teacher role' : 'No access'}
            icon={Users}
            loading={teachersEnabled && teachersQuery.isPending}
          />
          <StatCard
            label="Open invoices"
            value={feesEnabled ? pendingFeesTotal : '—'}
            hint={feesEnabled ? 'Issued + partial' : 'No access'}
            icon={DollarSign}
            loading={
              feesEnabled && (pendingFeesQuery.isPending || partialFeesQuery.isPending)
            }
          />
          <StatCard
            label="Published notices"
            value={noticesEnabled ? (noticesQuery.data?.pagination.total ?? 0) : '—'}
            hint={noticesEnabled ? 'School announcements' : 'No access'}
            icon={Megaphone}
            loading={noticesEnabled && noticesQuery.isPending}
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
              {noticesEnabled && (
                <Link
                  to="/notices"
                  className="inline-flex h-8 items-center rounded-lg border border-ink-200 bg-white px-3 text-xs font-semibold text-ink-700 transition hover:bg-ink-50"
                >
                  View all
                </Link>
              )}
            </div>

            {!noticesEnabled ? (
              <p className="mt-8 text-sm text-ink-500">You don’t have notice access.</p>
            ) : noticesQuery.isPending ? (
              <div className="mt-4 space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : noticesQuery.error ? (
              <div className="mt-6 rounded-xl border border-danger-100 bg-danger-50 px-4 py-3 text-sm text-danger-700">
                {noticesQuery.error.message}
              </div>
            ) : (noticesQuery.data?.items.length ?? 0) === 0 ? (
              <div className="mt-8 rounded-xl border border-dashed border-ink-200 px-4 py-10 text-center">
                <Megaphone className="mx-auto h-8 w-8 text-ink-300" aria-hidden="true" />
                <p className="mt-2 text-sm font-medium text-ink-800">No published notices yet</p>
                <p className="mt-1 text-xs text-ink-500">
                  Publish an announcement to keep staff informed.
                </p>
              </div>
            ) : (
              <ul className="mt-4 divide-y divide-ink-100">
                {noticesQuery.data?.items.map((notice) => (
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
