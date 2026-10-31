import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { PageLoader } from '@/components/ui/spinner';
import { StudentForm } from '../components/StudentForm';
import { useStudent } from '../hooks/useStudent';

export function StudentEditPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const studentQuery = useStudent(id);

  if (studentQuery.isPending) {
    return (
      <AppLayout>
        <PageLoader />
      </AppLayout>
    );
  }

  if (studentQuery.error || !studentQuery.data) {
    return (
      <AppLayout>
        <section className="py-12 text-center">
          <h1 className="text-lg font-semibold text-ink-950">Could not load student</h1>
          <p className="mt-2 text-sm text-ink-700">
            {studentQuery.error?.message ?? 'Student details were not returned.'}
          </p>
          <Button className="mt-4" variant="outline" onClick={() => navigate('/students')}>
            Back to students
          </Button>
        </section>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            aria-label="Back to student"
            onClick={() => navigate(`/students/${id}`)}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600">
              Students
            </p>
            <h1 className="page-title mt-1 text-2xl">Edit student</h1>
            <p className="page-subtitle">{studentQuery.data.fullName}</p>
          </div>
        </header>
        <StudentForm
          student={studentQuery.data}
          onSuccess={(student) => navigate(`/students/${student.id}`)}
          onCancel={() => navigate(`/students/${id}`)}
        />
      </div>
    </AppLayout>
  );
}
