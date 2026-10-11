import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Edit, Trash2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageLoader } from '@/components/ui/spinner';
import { DeleteSchoolDialog } from '../components/DeleteSchoolDialog';
import { EditSchoolModal } from '../components/EditSchoolModal';
import { StatusBadge } from '../components/StatusBadge';
import { useActivateSchool } from '../hooks/useActivateSchool';
import { useSchool } from '../hooks/useSchool';
import { useSuspendSchool } from '../hooks/useSuspendSchool';

export function SchoolDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { data: school, isPending, error, refetch, isFetching } = useSchool(id);
  const suspendSchool = useSuspendSchool();
  const activateSchool = useActivateSchool();

  if (isPending) {
    return <AppLayout><div className="py-12"><PageLoader /></div></AppLayout>;
  }

  if (error || !school) {
    return (
      <AppLayout>
        <div className="py-12 text-center">
          <h1 className="text-lg font-semibold text-gray-900">Could not load school</h1>
          <p className="mt-2 text-sm text-gray-600">{error?.message ?? 'School details were not returned.'}</p>
          <div className="mt-4 flex justify-center gap-3">
            <Button variant="outline" onClick={() => navigate('/schools')}>Back to schools</Button>
            <Button onClick={() => void refetch()} isLoading={isFetching}>Try again</Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const handleSuspend = () => {
    if (window.confirm(`Suspend ${school.name}?`)) {
      suspendSchool.mutate(school.id);
    }
  };

  const dateValue = (value: string | null) =>
    value ? new Date(value).toLocaleDateString() : '—';

  return (
    <AppLayout>
      <div className="max-w-4xl space-y-6">
        <header className="flex flex-wrap items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/schools')} aria-label="Back to schools">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{school.name}</h1>
              <StatusBadge status={school.status} />
            </div>
            <p className="mt-1 text-sm text-gray-500">{school.slug}</p>
          </div>
          <Button variant="outline" onClick={() => setShowEditModal(true)}>
            <Edit className="h-4 w-4" aria-hidden="true" />
            Edit
          </Button>
          {school.status === 'active' && (
            <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" onClick={handleSuspend} isLoading={suspendSchool.isPending}>
              Suspend
            </Button>
          )}
          {school.status === 'suspended' && (
            <Button onClick={() => activateSchool.mutate(school.id)} isLoading={activateSchool.isPending}>
              Activate
            </Button>
          )}
        </header>

        <Card>
          <CardHeader><CardTitle>School information</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <InfoRow label="Name" value={school.name} />
            <InfoRow label="Slug" value={school.slug} />
            <InfoRow label="Custom domain" value={school.customDomain ?? '—'} />
            <InfoRow label="City" value={school.city ?? '—'} />
            <InfoRow label="Address" value={school.address ?? '—'} />
            <InfoRow label="Plan" value={school.plan} />
            <InfoRow label="Max students" value={String(school.maxStudents)} />
            <InfoRow label="Max teachers" value={String(school.maxTeachers)} />
            <InfoRow label="Monthly SMS limit" value={String(school.maxSmsPerMonth)} />
            <InfoRow label="Custom role limit" value={String(school.maxCustomRoles)} />
            <InfoRow label="Created" value={dateValue(school.createdAt)} />
            <InfoRow label="Trial ends" value={dateValue(school.trialEndsAt)} />
            <InfoRow label="Subscription ends" value={dateValue(school.subscriptionEndsAt)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Owner information</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <InfoRow label="Name" value={school.ownerName} />
            <InfoRow label="Email" value={school.ownerEmail} />
            <InfoRow label="Phone" value={school.ownerPhone} />
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Danger zone</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="mb-1 text-sm font-medium text-gray-900">Delete this school</div>
              <p className="max-w-xl text-xs text-gray-500">
                The school will be soft-deleted, its users deactivated, and refresh tokens revoked.
                This operation does not configure a permanent data purge.
              </p>
            </div>
            <Button variant="danger" onClick={() => setShowDeleteDialog(true)}>
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Delete school
            </Button>
          </CardContent>
        </Card>
      </div>
      <EditSchoolModal
        school={school}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
      />
      <DeleteSchoolDialog
        school={school}
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
      />
    </AppLayout>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mb-1 text-xs text-gray-500">{label}</div>
      <div className="break-words text-sm font-medium text-gray-900">{value}</div>
    </div>
  );
}
