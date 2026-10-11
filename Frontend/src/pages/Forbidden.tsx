import { ShieldX } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function Forbidden() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <section className="max-w-md text-center">
        <ShieldX className="mx-auto mb-6 h-16 w-16 text-red-600" aria-hidden="true" />
        <h1 className="mb-2 text-3xl font-bold text-gray-900">403</h1>
        <h2 className="mb-4 text-xl font-semibold text-gray-700">Access denied</h2>
        <p className="mb-8 text-sm text-gray-500">You do not have permission to access this page. Please contact your administrator.</p>
        <Link to="/dashboard"><Button>Go to dashboard</Button></Link>
      </section>
    </main>
  );
}
