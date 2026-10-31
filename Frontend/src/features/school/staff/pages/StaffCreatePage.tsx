import { useState } from 'react';
import { ArrowLeft, CheckCircle2, Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
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
          <section className="panel border-success-100 p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-success-100">
                <CheckCircle2 className="h-6 w-6 text-success-700" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h1 className="font-display text-lg font-semibold text-ink-950">
                  Staff created successfully
                </h1>
                <p className="mt-1 truncate text-sm text-ink-500">{created.email}</p>
              </div>
            </div>
            <div className="mt-5 space-y-4">
              <div className="rounded-xl border border-warning-100 bg-warning-50 p-4">
                <p className="mb-2 text-sm font-semibold text-warning-700">
                  Temporary password — shown only once
                </p>
                <div className="flex flex-wrap gap-2">
                  <code className="min-w-0 flex-1 break-all rounded-xl border border-warning-100 bg-white px-3 py-2 font-mono text-sm">
                    {created.tempPassword}
                  </code>
                  <Button type="button" variant="outline" onClick={copyPassword}>
                    <Copy className="h-4 w-4" aria-hidden="true" /> Copy
                  </Button>
                </div>
              </div>
              <p className="text-sm text-ink-600">
                Email delivery is not configured, so share the temporary password securely. The staff
                member should change it after signing in.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => navigate('/settings/staff')}>Go to staff list</Button>
                <Button variant="outline" onClick={() => setCreated(null)}>
                  Add another staff member
                </Button>
              </div>
            </div>
          </section>
        ) : (
          <>
            <div className="flex items-start gap-3">
              <Button
                variant="ghost"
                size="sm"
                aria-label="Back to staff list"
                onClick={() => navigate('/settings/staff')}
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              </Button>
              <PageHeader
                eyebrow="Staff"
                title="Add staff"
                description="Create a staff account and assign a school role."
              />
            </div>
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
