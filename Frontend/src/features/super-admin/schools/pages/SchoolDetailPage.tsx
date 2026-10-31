import { useState } from 'react';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { PageHeader } from '@/components/ui/page-header';
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
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const { data: school, isPending, error, refetch, isFetching } = useSchool(id);
  const suspendSchool = useSuspendSchool();
  const activateSchool = useActivateSchool();

  if (isPending) {
    return (
      <AppLayout>
        <div className="panel">
          <PageLoader compact />
        </div>
      </AppLayout>
    );
  }

  if (error || !school) {
    return (
      <AppLayout>
        <section className="panel p-8 text-center">
          <h1 className="font-display text-lg font-semibold text-ink-950">Could not load school</h1>
          <p className="mt-2 text-sm text-ink-600">
            {error?.message ?? 'School details were not returned.'}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Button variant="outline" onClick={() => navigate('/schools')}>
              Back to schools
            </Button>
            <Button onClick={() => void refetch()} isLoading={isFetching}>
              Try again
            </Button>
          </div>
        </section>
      </AppLayout>
    );
  }

  const dateValue = (value: string | null) =>
    value ? new Date(value).toLocaleDateString() : '—';

  return (
    <AppLayout>
      <div className="max-w-4xl space-y-6">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/schools')} aria-label="Back to schools">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
          <div className="min-w-0 flex-1">
            <PageHeader
              eyebrow="School"
              title={school.name}
              description={school.slug}
              actions={
                <>
                  <StatusBadge status={school.status} />
                  <Button variant="outline" onClick={() => setShowEditModal(true)}>
                    <Edit className="h-4 w-4" aria-hidden="true" />
                    Edit
                  </Button>
                  {school.status === 'active' && (
                    <Button
                      variant="outline"
                      className="border-danger-100 text-danger-600 hover:bg-danger-50"
                      onClick={() => setShowSuspendDialog(true)}
                      isLoading={suspendSchool.isPending}
                    >
                      Suspend
                    </Button>
                  )}
                  {school.status === 'suspended' && (
                    <Button
                      onClick={() => activateSchool.mutate(school.id)}
                      isLoading={activateSchool.isPending}
                    >
                      Activate
                    </Button>
                  )}
                </>
              }
            />
          </div>
        </div>

        <section className="panel p-4 sm:p-5">
          <h2 className="font-display text-base font-semibold text-ink-950">School information</h2>
          <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
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
          </div>
        </section>

        <section className="panel p-4 sm:p-5">
          <h2 className="font-display text-base font-semibold text-ink-950">Owner information</h2>
          <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <InfoRow label="Name" value={school.ownerName} />
            <InfoRow label="Email" value={school.ownerEmail} />
            <InfoRow label="Phone" value={school.ownerPhone} />
          </div>
        </section>

        <section className="panel border-danger-100 p-4 sm:p-5">
          <h2 className="font-display text-base font-semibold text-danger-600">Danger zone</h2>
          <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="mb-1 text-sm font-medium text-ink-950">Delete this school</div>
              <p className="max-w-xl text-xs text-ink-500">
                The school will be soft-deleted, its users deactivated, and refresh tokens revoked.
                This operation does not configure a permanent data purge.
              </p>
            </div>
            <Button variant="danger" onClick={() => setShowDeleteDialog(true)}>
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Delete school
            </Button>
          </div>
        </section>
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
      <ConfirmDialog
        open={showSuspendDialog}
        title="Suspend school"
        description={`Suspend ${school.name}?`}
        confirmLabel="Suspend"
        loading={suspendSchool.isPending}
        onClose={() => setShowSuspendDialog(false)}
        onConfirm={() =>
          suspendSchool.mutate(school.id, { onSettled: () => setShowSuspendDialog(false) })
        }
      />
    </AppLayout>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="mb-1 text-xs text-ink-500">{label}</div>
      <div className="break-words text-sm font-medium text-ink-950">{value}</div>
    </div>
  );
}
