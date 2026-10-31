import { useState } from 'react';
import { ArrowLeft, BookOpen, School, Trash2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageLoader } from '@/components/ui/spinner';
import { usePermission } from '@/hooks/usePermission';
import { AssignSubjectModal } from '../components/AssignSubjectModal';
import { SetClassTeacherModal } from '../components/SetClassTeacherModal';
import { useDeleteAssignment, useSetClassTeacher } from '../hooks/useAssignments';
import { useTeacher } from '../hooks/useTeacher';

export function TeacherDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { can } = usePermission();
  const teacherQuery = useTeacher(id);
  const deleteAssignment = useDeleteAssignment();
  const setClassTeacher = useSetClassTeacher();
  const [assignOpen, setAssignOpen] = useState(false);
  const [classTeacherOpen, setClassTeacherOpen] = useState(false);
  const teacher = teacherQuery.data;
  const canUpdate = can('teachers.update');

  if (teacherQuery.isPending) {
    return (
      <AppLayout>
        <PageLoader />
      </AppLayout>
    );
  }

  if (teacherQuery.error || !teacher) {
    return (
      <AppLayout>
        <section className="py-12 text-center">
          <h1 className="text-lg font-semibold text-ink-950">Could not load teacher</h1>
          <p className="mt-2 text-sm text-ink-700">
            {teacherQuery.error?.message ?? 'Teacher details were not returned.'}
          </p>
          <Button className="mt-4" variant="outline" onClick={() => navigate('/teachers')}>
            Back to teachers
          </Button>
        </section>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/teachers')}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to teachers
        </Button>

        <header className="flex flex-wrap items-start gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-600 text-xl font-bold text-white shadow-soft">
            {teacher.fullName
              .split(/\s+/)
              .map((part) => part[0])
              .slice(0, 2)
              .join('')
              .toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="page-title text-2xl">{teacher.fullName}</h1>
            <p className="mt-1 text-sm text-ink-700/70">{teacher.email}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  teacher.isActive ? 'bg-green-100 text-green-800' : 'bg-ink-100 text-ink-800'
                }`}
              >
                {teacher.isActive ? 'Active' : 'Inactive'}
              </span>
              {teacher.subject && (
                <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700">
                  {teacher.subject}
                </span>
              )}
            </div>
          </div>
          {canUpdate && (
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setAssignOpen(true)}>
                <BookOpen className="h-4 w-4" aria-hidden="true" /> Assign subject
              </Button>
              <Button variant="outline" onClick={() => setClassTeacherOpen(true)}>
                <School className="h-4 w-4" aria-hidden="true" /> Set class teacher
              </Button>
            </div>
          )}
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Subject assignments ({teacher.assignments.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {teacher.assignments.length === 0 ? (
                <p className="text-sm text-ink-700/70">No subject assignments yet.</p>
              ) : (
                <ul className="space-y-3">
                  {teacher.assignments.map((assignment) => (
                    <li
                      key={assignment.id}
                      className="flex items-start justify-between gap-3 rounded-xl border border-ink-100 bg-surface/40 p-3"
                    >
                      <div>
                        <p className="font-medium text-ink-950">
                          {assignment.subjectName}{' '}
                          <span className="text-xs text-ink-700/60">({assignment.subjectCode})</span>
                        </p>
                        <p className="mt-1 text-sm text-ink-700">
                          {assignment.className} · {assignment.sectionName}
                        </p>
                      </div>
                      {canUpdate && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          aria-label="Remove assignment"
                          onClick={() => {
                            if (
                              window.confirm(
                                `Remove ${assignment.subjectName} from ${assignment.className}-${assignment.sectionName}?`,
                              )
                            ) {
                              deleteAssignment.mutate(assignment.id, {
                                onSuccess: () => void teacherQuery.refetch(),
                              });
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Class teacher of ({teacher.classTeacherSections.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {teacher.classTeacherSections.length === 0 ? (
                <p className="text-sm text-ink-700/70">Not a class teacher of any section.</p>
              ) : (
                <ul className="space-y-3">
                  {teacher.classTeacherSections.map((section) => (
                    <li
                      key={section.sectionId}
                      className="flex items-start justify-between gap-3 rounded-xl border border-ink-100 bg-surface/40 p-3"
                    >
                      <div>
                        <p className="font-medium text-ink-950">{section.fullName}</p>
                        <p className="mt-1 text-sm text-ink-700">
                          {section.className} · Section {section.sectionName}
                        </p>
                      </div>
                      {canUpdate && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          aria-label="Clear class teacher"
                          onClick={() => {
                            if (
                              window.confirm(
                                `Remove ${teacher.fullName} as class teacher of ${section.fullName}?`,
                              )
                            ) {
                              setClassTeacher.mutate(
                                { sectionId: section.sectionId, teacherId: null },
                                { onSuccess: () => void teacherQuery.refetch() },
                              );
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

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
