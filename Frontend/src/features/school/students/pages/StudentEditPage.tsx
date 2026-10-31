import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
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
        <div className="panel">
          <PageLoader compact />
        </div>
      </AppLayout>
    );
  }

  if (studentQuery.error || !studentQuery.data) {
    return (
      <AppLayout>
        <section className="panel p-8 text-center">
          <h1 className="font-display text-lg font-semibold text-ink-950">Could not load student</h1>
          <p className="mt-2 text-sm text-ink-600">
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
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="sm"
            aria-label="Back to student"
            onClick={() => navigate(`/students/${id}`)}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
          <PageHeader eyebrow="Students" title="Edit student" description={studentQuery.data.fullName} />
        </div>
        <StudentForm
          student={studentQuery.data}
          onSuccess={(student) => navigate(`/students/${student.id}`)}
          onCancel={() => navigate(`/students/${id}`)}
        />
      </div>
    </AppLayout>
  );
}
