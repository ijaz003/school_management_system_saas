import type { ReactNode } from 'react';
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
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageLoader } from '@/components/ui/spinner';
import { usePermission } from '@/hooks/usePermission';
import { useDeleteStudent } from '../hooks/useDeleteStudent';
import { useStudent } from '../hooks/useStudent';

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-ink-100 text-ink-800',
  transferred: 'bg-amber-100 text-amber-800',
  alumni: 'bg-primary-100 text-primary-800',
};

export function StudentDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { can } = usePermission();
  const studentQuery = useStudent(id);
  const deleteStudent = useDeleteStudent();
  const student = studentQuery.data;

  if (studentQuery.isPending) {
    return (
      <AppLayout>
        <PageLoader />
      </AppLayout>
    );
  }

  if (studentQuery.error || !student) {
    return (
      <AppLayout>
        <section className="py-12 text-center">
          <h1 className="text-lg font-semibold text-ink-950">Could not load student</h1>
          <p className="mt-2 text-sm text-ink-700">
            {studentQuery.error?.message ?? 'Student details were not returned.'}
          </p>
          <div className="mt-4 flex justify-center gap-3">
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
    if (!window.confirm(`Delete student "${student.fullName}"?`)) return;
    deleteStudent.mutate(student.id, {
      onSuccess: () => navigate('/students', { replace: true }),
    });
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/students')}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to students
        </Button>

        <header className="flex flex-wrap items-start gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-600 text-xl font-bold text-white shadow-soft">
            {student.fullName
              .split(/\s+/)
              .map((part) => part[0])
              .slice(0, 2)
              .join('')
              .toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="page-title text-2xl">{student.fullName}</h1>
            <p className="mt-1 font-mono text-sm text-ink-700/70">{student.admissionNo}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700">
                {student.className} · {student.sectionName}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
                  STATUS_STYLES[student.status] ?? STATUS_STYLES.inactive
                }`}
              >
                {student.status}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {can('students.update') && (
              <Button variant="outline" onClick={() => navigate(`/students/${student.id}/edit`)}>
                Edit student
              </Button>
            )}
            {can('students.delete') && (
              <Button
                variant="danger"
                onClick={handleDelete}
                isLoading={deleteStudent.isPending}
              >
                Delete
              </Button>
            )}
          </div>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Personal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow
                icon={<UserRound className="h-4 w-4" />}
                label="Gender"
                value={student.gender}
              />
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
              <InfoRow
                icon={<Mail className="h-4 w-4" />}
                label="Email"
                value={student.email || '—'}
              />
              <InfoRow
                icon={<Phone className="h-4 w-4" />}
                label="Phone"
                value={student.phone || '—'}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Guardian</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow
                icon={<UserRound className="h-4 w-4" />}
                label="Name"
                value={student.guardianName}
              />
              <InfoRow
                icon={<Phone className="h-4 w-4" />}
                label="Phone"
                value={student.guardianPhone}
              />
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
            </CardContent>
          </Card>
        </div>

        {(student.address || student.notes) && (
          <Card>
            <CardHeader>
              <CardTitle>Additional information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {student.address && (
                <div>
                  <p className="text-xs text-ink-700/65">Address</p>
                  <p className="mt-1 text-sm text-ink-900">{student.address}</p>
                </div>
              )}
              {student.notes && (
                <div>
                  <p className="text-xs text-ink-700/65">Notes</p>
                  <p className="mt-1 text-sm text-ink-900">{student.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}

function InfoRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-ink-700/45">{icon}</span>
      <div>
        <p className="text-xs text-ink-700/65">{label}</p>
        <p className="text-sm capitalize text-ink-950">{value}</p>
      </div>
    </div>
  );
}
