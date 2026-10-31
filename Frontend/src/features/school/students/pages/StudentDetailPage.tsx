import { useState, type ReactNode } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  GraduationCap,
  Mail,
  Phone,
  UserRound,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { PageHeader } from '@/components/ui/page-header';
import { PageLoader } from '@/components/ui/spinner';
import { usePermission } from '@/hooks/usePermission';
import { useDeleteStudent } from '../hooks/useDeleteStudent';
import { useStudent } from '../hooks/useStudent';

const STATUS_TONES: Record<string, 'success' | 'neutral' | 'warning' | 'primary'> = {
  active: 'success',
  inactive: 'neutral',
  transferred: 'warning',
  alumni: 'primary',
};

export function StudentDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { can } = usePermission();
  const studentQuery = useStudent(id);
  const deleteStudent = useDeleteStudent();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const student = studentQuery.data;

  if (studentQuery.isPending) {
    return (
      <AppLayout>
        <div className="panel">
          <PageLoader compact />
        </div>
      </AppLayout>
    );
  }

  if (studentQuery.error || !student) {
    return (
      <AppLayout>
        <section className="panel p-8 text-center">
          <h1 className="font-display text-lg font-semibold text-ink-950">Could not load student</h1>
          <p className="mt-2 text-sm text-ink-600">
            {studentQuery.error?.message ?? 'Student details were not returned.'}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Button variant="outline" onClick={() => navigate('/students')}>
              Back to students
            </Button>
            <Button onClick={() => void studentQuery.refetch()} isLoading={studentQuery.isFetching}>
              Try again
            </Button>
          </div>
        </section>
      </AppLayout>
    );
  }

  const handleDelete = () => {
    deleteStudent.mutate(student.id, {
      onSuccess: () => navigate('/students', { replace: true }),
      onSettled: () => setConfirmDelete(false),
    });
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/students')}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to students
        </Button>

        <section className="panel flex flex-wrap items-start gap-4 p-4 sm:gap-5 sm:p-6">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary-700 text-xl font-bold text-white shadow-sm">
            {student.fullName
              .split(/\s+/)
              .map((part) => part[0])
              .slice(0, 2)
              .join('')
              .toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <PageHeader
              eyebrow="Student"
              title={student.fullName}
              description={student.admissionNo}
              actions={
                <>
                  {can('students.update') && (
                    <Button variant="outline" onClick={() => navigate(`/students/${student.id}/edit`)}>
                      Edit student
                    </Button>
                  )}
                  {can('students.delete') && (
                    <Button
                      variant="danger"
                      onClick={() => setConfirmDelete(true)}
                      isLoading={deleteStudent.isPending}
                    >
                      Delete
                    </Button>
                  )}
                </>
              }
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge tone="primary" className="normal-case">
                {student.className} · {student.sectionName}
              </Badge>
              <Badge tone={STATUS_TONES[student.status] ?? 'neutral'}>{student.status}</Badge>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <section className="panel p-4 sm:p-5">
            <h2 className="font-display text-base font-semibold text-ink-950">Personal</h2>
            <div className="mt-4 space-y-4">
              <InfoRow icon={<UserRound className="h-4 w-4" />} label="Gender" value={student.gender} />
              <InfoRow
                icon={<CalendarDays className="h-4 w-4" />}
                label="Date of birth"
                value={new Date(student.dateOfBirth).toLocaleDateString()}
              />
              <InfoRow
                icon={<GraduationCap className="h-4 w-4" />}
                label="Blood group"
                value={student.bloodGroup || '—'}
              />
              <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={student.email || '—'} />
              <InfoRow icon={<Phone className="h-4 w-4" />} label="Phone" value={student.phone || '—'} />
            </div>
          </section>

          <section className="panel p-4 sm:p-5">
            <h2 className="font-display text-base font-semibold text-ink-950">Guardian</h2>
            <div className="mt-4 space-y-4">
              <InfoRow icon={<UserRound className="h-4 w-4" />} label="Name" value={student.guardianName} />
              <InfoRow icon={<Phone className="h-4 w-4" />} label="Phone" value={student.guardianPhone} />
              <InfoRow
                icon={<Mail className="h-4 w-4" />}
                label="Email"
                value={student.guardianEmail || '—'}
              />
              <InfoRow
                icon={<UserRound className="h-4 w-4" />}
                label="Relation"
                value={student.guardianRelation || '—'}
              />
              <InfoRow
                icon={<CalendarDays className="h-4 w-4" />}
                label="Admission date"
                value={new Date(student.admissionDate).toLocaleDateString()}
              />
            </div>
          </section>
        </div>

        {(student.address || student.notes) && (
          <section className="panel p-4 sm:p-5">
            <h2 className="font-display text-base font-semibold text-ink-950">
              Additional information
            </h2>
            <div className="mt-4 space-y-4">
              {student.address && (
                <div>
                  <p className="text-xs text-ink-500">Address</p>
                  <p className="mt-1 break-words text-sm text-ink-900">{student.address}</p>
                </div>
              )}
              {student.notes && (
                <div>
                  <p className="text-xs text-ink-500">Notes</p>
                  <p className="mt-1 break-words text-sm text-ink-900">{student.notes}</p>
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete student"
        description={`Delete student "${student.fullName}"?`}
        confirmLabel="Delete"
        loading={deleteStudent.isPending}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
      />
    </AppLayout>
  );
}

function InfoRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-ink-400">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-ink-500">{label}</p>
        <p className="break-words text-sm capitalize text-ink-950">{value}</p>
      </div>
    </div>
  );
}
