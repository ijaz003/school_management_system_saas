import type { ReactNode } from 'react';
import { ArrowLeft, BriefcaseBusiness, CalendarDays, Mail, Phone } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { PageLoader } from '@/components/ui/spinner';
import { useStaffMember } from '../hooks/useStaffMember';

export function StaffDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const staffQuery = useStaffMember(id);
  const staff = staffQuery.data;

  if (staffQuery.isPending) {
    return (
      <AppLayout>
        <div className="panel">
          <PageLoader compact />
        </div>
      </AppLayout>
    );
  }
  if (staffQuery.error || !staff) {
    return (
      <AppLayout>
        <section className="panel p-8 text-center">
          <h1 className="font-display text-lg font-semibold text-ink-950">Could not load staff member</h1>
          <p className="mt-2 text-sm text-ink-600">
            {staffQuery.error?.message ?? 'Staff details were not returned.'}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Button variant="outline" onClick={() => navigate('/settings/staff')}>
              Back to staff
            </Button>
            <Button onClick={() => void staffQuery.refetch()} isLoading={staffQuery.isFetching}>
              Try again
            </Button>
          </div>
        </section>
      </AppLayout>
    );
  }

  const roleLabel = staff.role
    .split('_')
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ');
  const joinedDate = staff.metadata?.joiningDate ?? staff.createdAt;

  return (
    <AppLayout>
      <div className="max-w-4xl space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/settings/staff')}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to staff
        </Button>

        <section className="panel flex flex-wrap items-start gap-4 p-4 sm:gap-5 sm:p-6">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary-700 text-xl font-bold text-white shadow-sm">
            {staff.fullName
              .split(/\s+/)
              .map((part) => part[0])
              .slice(0, 2)
              .join('')
              .toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <PageHeader
              eyebrow="Staff"
              title={staff.fullName}
              description={staff.email}
              actions={
                <Button variant="outline" onClick={() => navigate(`/settings/staff/${staff.id}/edit`)}>
                  Edit staff
                </Button>
              }
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge tone="primary">{roleLabel}</Badge>
              <Badge tone={staff.isActive ? 'success' : 'neutral'}>
                {staff.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <section className="panel p-4 sm:p-5">
            <h2 className="font-display text-base font-semibold text-ink-950">Contact information</h2>
            <div className="mt-4 space-y-4">
              <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={staff.email} />
              <InfoRow icon={<Phone className="h-4 w-4" />} label="Phone" value={staff.phone || '—'} />
            </div>
          </section>
          <section className="panel p-4 sm:p-5">
            <h2 className="font-display text-base font-semibold text-ink-950">Role and position</h2>
            <div className="mt-4 space-y-4">
              <InfoRow icon={<BriefcaseBusiness className="h-4 w-4" />} label="Role" value={roleLabel} />
              <InfoRow
                icon={<BriefcaseBusiness className="h-4 w-4" />}
                label="Subject"
                value={staff.metadata?.subject || '—'}
              />
              <InfoRow
                icon={<CalendarDays className="h-4 w-4" />}
                label="Joining date"
                value={new Date(joinedDate).toLocaleDateString()}
              />
            </div>
          </section>
        </div>

        <section className="panel p-4 sm:p-5">
          <h2 className="font-display text-base font-semibold text-ink-950">
            Permissions ({staff.permissions.length})
          </h2>
          <div className="mt-4">
            {staff.permissions.length === 0 ? (
              <p className="rounded-xl bg-ink-50 p-4 text-sm text-ink-500">No permissions assigned.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {staff.permissions.map((permission) => (
                  <span
                    key={permission}
                    className="break-all rounded-md bg-ink-100 px-2.5 py-1 font-mono text-xs text-ink-700"
                  >
                    {permission}
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}

function InfoRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-ink-400">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-ink-500">{label}</p>
        <p className="mt-0.5 break-words text-sm font-medium text-ink-950">{value}</p>
      </div>
    </div>
  );
}
