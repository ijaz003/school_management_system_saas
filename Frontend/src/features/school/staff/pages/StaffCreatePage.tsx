import { useState } from 'react';
import { ArrowLeft, CheckCircle2, Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StaffForm } from '../components/StaffForm';

export function StaffCreatePage() {
  const navigate = useNavigate();
  const [created, setCreated] = useState<{ tempPassword: string; email: string } | null>(null);

  const copyPassword = async () => {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(created.tempPassword);
      toast.success('Temporary password copied');
    } catch {
      toast.error('Could not copy the password. Select and copy it manually.');
    }
  };

  return (
    <AppLayout>
      <div className="max-w-3xl space-y-6">
        {created ? (
          <Card className="border-green-200">
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle2 className="h-6 w-6 text-green-600" aria-hidden="true" />
                </span>
                <div>
                  <CardTitle>Staff created successfully</CardTitle>
                  <p className="mt-1 text-sm text-gray-500">{created.email}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="mb-2 text-sm font-semibold text-amber-900">Temporary password — shown only once</p>
                <div className="flex flex-wrap gap-2">
                  <code className="min-w-0 flex-1 break-all rounded-lg border bg-white px-3 py-2 font-mono text-sm">{created.tempPassword}</code>
                  <Button type="button" variant="outline" onClick={copyPassword}>
                    <Copy className="h-4 w-4" aria-hidden="true" /> Copy
                  </Button>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Email delivery is not configured, so share the temporary password securely. The staff member should change it after signing in.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => navigate('/settings/staff')}>Go to staff list</Button>
                <Button variant="outline" onClick={() => setCreated(null)}>Add another staff member</Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <header className="flex items-center gap-3">
              <Button variant="ghost" size="sm" aria-label="Back to staff list" onClick={() => navigate('/settings/staff')}>
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Add staff</h1>
                <p className="mt-1 text-sm text-gray-500">Create a staff account and assign a school role.</p>
              </div>
            </header>
            <StaffForm
              onSuccess={(result) => {
                if (result) setCreated(result);
                else navigate('/settings/staff');
              }}
              onCancel={() => navigate('/settings/staff')}
            />
          </>
        )}
      </div>
    </AppLayout>
  );
}
