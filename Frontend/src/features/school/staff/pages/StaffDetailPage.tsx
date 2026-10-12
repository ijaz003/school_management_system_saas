import type { ReactNode } from 'react';
import { ArrowLeft, BriefcaseBusiness, CalendarDays, Mail, Phone } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageLoader } from '@/components/ui/spinner';
import { useStaffMember } from '../hooks/useStaffMember';

export function StaffDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const staffQuery = useStaffMember(id);
  const staff = staffQuery.data;

  if (staffQuery.isPending) return <AppLayout><PageLoader /></AppLayout>;
  if (staffQuery.error || !staff) {
    return (
      <AppLayout>
        <section className="py-12 text-center">
          <h1 className="text-lg font-semibold text-gray-900">Could not load staff member</h1>
          <p className="mt-2 text-sm text-gray-600">{staffQuery.error?.message ?? 'Staff details were not returned.'}</p>
          <div className="mt-4 flex justify-center gap-3">
            <Button variant="outline" onClick={() => navigate('/settings/staff')}>Back to staff</Button>
            <Button onClick={() => void staffQuery.refetch()} isLoading={staffQuery.isFetching}>Try again</Button>
          </div>
        </section>
      </AppLayout>
    );
  }

  const roleLabel = staff.role.split('_').map((part) => part[0].toUpperCase() + part.slice(1)).join(' ');
  const joinedDate = staff.metadata?.joiningDate ?? staff.createdAt;

  return (
    <AppLayout>
      <div className="max-w-4xl space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/settings/staff')}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to staff
        </Button>
        <header className="flex flex-wrap items-start gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-xl font-bold text-white shadow-lg">
            {staff.fullName.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{staff.fullName}</h1>
            <p className="mt-1 text-sm text-gray-500">{staff.email}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">{roleLabel}</span>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${staff.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                {staff.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate(`/settings/staff/${staff.id}/edit`)}>Edit staff</Button>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Contact information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={staff.email} />
              <InfoRow icon={<Phone className="h-4 w-4" />} label="Phone" value={staff.phone || '—'} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Role and position</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <InfoRow icon={<BriefcaseBusiness className="h-4 w-4" />} label="Role" value={roleLabel} />
              <InfoRow icon={<BriefcaseBusiness className="h-4 w-4" />} label="Subject" value={staff.metadata?.subject || '—'} />
              <InfoRow icon={<CalendarDays className="h-4 w-4" />} label="Joining date" value={new Date(joinedDate).toLocaleDateString()} />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Permissions ({staff.permissions.length})</CardTitle></CardHeader>
          <CardContent>
            {staff.permissions.length === 0 ? (
              <p className="text-sm text-gray-500">No permissions assigned.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {staff.permissions.map((permission) => (
                  <span key={permission} className="rounded-md bg-gray-100 px-2.5 py-1 font-mono text-xs text-gray-700">{permission}</span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

function InfoRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-gray-400">{icon}</span>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="mt-0.5 break-words text-sm font-medium text-gray-900">{value}</p>
      </div>
    </div>
  );
}
