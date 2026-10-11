import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { SchoolForm } from '../components/SchoolForm';

export function SchoolCreatePage() {
  const navigate = useNavigate();
  return (
    <AppLayout>
      <div className="space-y-6">
        <header className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/schools')} aria-label="Back to schools">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create new school</h1>
            <p className="mt-1 text-sm text-gray-500">Add a school and its administrator to the platform</p>
          </div>
        </header>
        <SchoolForm />
      </div>
    </AppLayout>
  );
}
