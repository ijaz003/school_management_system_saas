import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { PageLoader } from '@/components/ui/spinner';
import { StaffForm } from '../components/StaffForm';
import { useStaffMember } from '../hooks/useStaffMember';

export function StaffEditPage() {
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
          <Button className="mt-4" onClick={() => navigate('/settings/staff')}>
            Back to staff
          </Button>
        </section>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-3xl space-y-6">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="sm"
            aria-label="Back to staff list"
            onClick={() => navigate('/settings/staff')}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
          <PageHeader
            eyebrow="Staff"
            title="Edit staff"
            description={`Update ${staff.fullName}'s details.`}
          />
        </div>
        <StaffForm
          staff={staff}
          onSuccess={() => navigate(`/settings/staff/${staff.id}`)}
          onCancel={() => navigate(`/settings/staff/${staff.id}`)}
        />
      </div>
    </AppLayout>
  );
}
