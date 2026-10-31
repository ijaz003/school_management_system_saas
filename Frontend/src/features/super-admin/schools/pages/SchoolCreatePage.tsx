import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { SchoolForm } from '../components/SchoolForm';

export function SchoolCreatePage() {
  const navigate = useNavigate();
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/schools')} aria-label="Back to schools">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
          <PageHeader
            eyebrow="Platform"
            title="Create new school"
            description="Add a school and its administrator to the platform"
          />
        </div>
        <SchoolForm />
      </div>
    </AppLayout>
  );
}
