import { useState } from 'react';
import { ArrowLeft, BookOpen, School, Trash2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { PageHeader } from '@/components/ui/page-header';
import { PageLoader } from '@/components/ui/spinner';
import { usePermission } from '@/hooks/usePermission';
import { AssignSubjectModal } from '../components/AssignSubjectModal';
import { SetClassTeacherModal } from '../components/SetClassTeacherModal';
import { useDeleteAssignment, useSetClassTeacher } from '../hooks/useAssignments';
import { useTeacher } from '../hooks/useTeacher';

type PendingConfirm =
  | { kind: 'assignment'; id: string; message: string }
  | { kind: 'classTeacher'; sectionId: string; message: string };

export function TeacherDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { can } = usePermission();
  const teacherQuery = useTeacher(id);
  const deleteAssignment = useDeleteAssignment();
  const setClassTeacher = useSetClassTeacher();
  const [assignOpen, setAssignOpen] = useState(false);
  const [classTeacherOpen, setClassTeacherOpen] = useState(false);
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const teacher = teacherQuery.data;
  const canUpdate = can('teachers.update');

  if (teacherQuery.isPending) {
    return (
      <AppLayout>
        <div className="panel">
          <PageLoader compact />
        </div>
      </AppLayout>
    );
  }

  if (teacherQuery.error || !teacher) {
    return (
      <AppLayout>
        <section className="panel p-8 text-center">
          <h1 className="font-display text-lg font-semibold text-ink-950">Could not load teacher</h1>
          <p className="mt-2 text-sm text-ink-600">
            {teacherQuery.error?.message ?? 'Teacher details were not returned.'}
          </p>
          <Button className="mt-4" variant="outline" onClick={() => navigate('/teachers')}>
            Back to teachers
          </Button>
        </section>
      </AppLayout>
    );
  }

  const confirmPending = () => {
    if (!pending) return;
    if (pending.kind === 'assignment') {
      deleteAssignment.mutate(pending.id, {
        onSuccess: () => void teacherQuery.refetch(),
        onSettled: () => setPending(null),
      });
    } else {
      setClassTeacher.mutate(
        { sectionId: pending.sectionId, teacherId: null },
        {
          onSuccess: () => void teacherQuery.refetch(),
          onSettled: () => setPending(null),
        },
      );
    }
  };

  const initials = teacher.fullName
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/teachers')}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to teachers
        </Button>

        <section className="panel flex flex-wrap items-start gap-4 p-4 sm:gap-5 sm:p-6">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary-700 text-xl font-bold text-white shadow-sm">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <PageHeader
              eyebrow="Teacher"
              title={teacher.fullName}
              description={teacher.email}
              actions={
                canUpdate ? (
                  <>
                    <Button onClick={() => setAssignOpen(true)}>
                      <BookOpen className="h-4 w-4" aria-hidden="true" /> Assign subject
                    </Button>
                    <Button variant="outline" onClick={() => setClassTeacherOpen(true)}>
                      <School className="h-4 w-4" aria-hidden="true" /> Set class teacher
                    </Button>
                  </>
                ) : undefined
              }
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge tone={teacher.isActive ? 'success' : 'neutral'}>
                {teacher.isActive ? 'Active' : 'Inactive'}
              </Badge>
              {teacher.subject && <Badge tone="primary">{teacher.subject}</Badge>}
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="panel p-4 sm:p-5">
            <h2 className="font-display text-base font-semibold text-ink-950">
              Subject assignments ({teacher.assignments.length})
            </h2>
            <div className="mt-4">
              {teacher.assignments.length === 0 ? (
                <p className="rounded-xl bg-ink-50 p-4 text-sm text-ink-500">
                  No subject assignments yet.
                </p>
              ) : (
                <ul className="space-y-3">
                  {teacher.assignments.map((assignment) => (
                    <li
                      key={assignment.id}
                      className="flex items-start justify-between gap-3 rounded-xl border border-ink-100 bg-ink-50/60 p-3"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-ink-950">
                          {assignment.subjectName}{' '}
                          <span className="text-xs text-ink-500">({assignment.subjectCode})</span>
                        </p>
                        <p className="mt-1 text-sm text-ink-600">
                          {assignment.className} · {assignment.sectionName}
                        </p>
                      </div>
                      {canUpdate && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          aria-label="Remove assignment"
                          onClick={() =>
                            setPending({
                              kind: 'assignment',
                              id: assignment.id,
                              message: `Remove ${assignment.subjectName} from ${assignment.className}-${assignment.sectionName}?`,
                            })
                          }
                        >
                          <Trash2 className="h-4 w-4 text-danger-600" aria-hidden="true" />
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="panel p-4 sm:p-5">
            <h2 className="font-display text-base font-semibold text-ink-950">
              Class teacher of ({teacher.classTeacherSections.length})
            </h2>
            <div className="mt-4">
              {teacher.classTeacherSections.length === 0 ? (
                <p className="rounded-xl bg-ink-50 p-4 text-sm text-ink-500">
                  Not a class teacher of any section.
                </p>
              ) : (
                <ul className="space-y-3">
                  {teacher.classTeacherSections.map((section) => (
                    <li
                      key={section.sectionId}
                      className="flex items-start justify-between gap-3 rounded-xl border border-ink-100 bg-ink-50/60 p-3"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-ink-950">{section.fullName}</p>
                        <p className="mt-1 text-sm text-ink-600">
                          {section.className} · Section {section.sectionName}
                        </p>
                      </div>
                      {canUpdate && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          aria-label="Clear class teacher"
                          onClick={() =>
                            setPending({
                              kind: 'classTeacher',
                              sectionId: section.sectionId,
                              message: `Remove ${teacher.fullName} as class teacher of ${section.fullName}?`,
                            })
                          }
                        >
                          <Trash2 className="h-4 w-4 text-danger-600" aria-hidden="true" />
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      </div>

      <ConfirmDialog
        open={pending !== null}
        title="Confirm removal"
        description={pending?.message ?? ''}
        confirmLabel="Remove"
        loading={deleteAssignment.isPending || setClassTeacher.isPending}
        onConfirm={confirmPending}
        onClose={() => setPending(null)}
      />

      {assignOpen && (
        <AssignSubjectModal
          teacherId={teacher.id}
          teacherName={teacher.fullName}
          onClose={() => {
            setAssignOpen(false);
            void teacherQuery.refetch();
          }}
        />
      )}
      {classTeacherOpen && (
        <SetClassTeacherModal
          teacherId={teacher.id}
          teacherName={teacher.fullName}
          onClose={() => {
            setClassTeacherOpen(false);
            void teacherQuery.refetch();
          }}
        />
      )}
    </AppLayout>
  );
}
