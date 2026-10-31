import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { StudentForm } from '../components/StudentForm';

export function StudentCreatePage() {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="sm"
            aria-label="Back to students"
            onClick={() => navigate('/students')}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
          <PageHeader
            eyebrow="Students"
            title="Add student"
            description="Create an admission record and place the student in a class."
          />
        </div>
        <StudentForm
          onSuccess={(student) => navigate(`/students/${student.id}`)}
          onCancel={() => navigate('/students')}
        />
      </div>
    </AppLayout>
  );
}
