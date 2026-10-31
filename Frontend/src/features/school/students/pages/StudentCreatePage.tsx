import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { StudentForm } from '../components/StudentForm';

export function StudentCreatePage() {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            aria-label="Back to students"
            onClick={() => navigate('/students')}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600">
              Students
            </p>
            <h1 className="page-title mt-1 text-2xl">Add student</h1>
            <p className="page-subtitle">Create an admission record and place the student in a class.</p>
          </div>
        </header>
        <StudentForm
          onSuccess={(student) => navigate(`/students/${student.id}`)}
          onCancel={() => navigate('/students')}
        />
      </div>
    </AppLayout>
  );
}
