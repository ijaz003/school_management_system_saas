import { ShieldX } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function Forbidden() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas p-4">
      <section className="panel max-w-md px-8 py-10 text-center">
        <ShieldX className="mx-auto mb-5 h-14 w-14 text-danger-600" aria-hidden="true" />
        <p className="eyebrow">Error 403</p>
        <h1 className="page-title mt-2">Access denied</h1>
        <p className="page-subtitle mx-auto">
          You do not have permission to access this page. Contact your administrator if you need
          access.
        </p>
        <Link to="/dashboard" className="mt-8 inline-flex">
          <Button>Go to dashboard</Button>
        </Link>
      </section>
    </main>
  );
}
