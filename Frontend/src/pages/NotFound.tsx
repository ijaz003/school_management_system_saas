import { FileQuestion } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas p-4">
      <section className="panel max-w-md px-8 py-10 text-center">
        <FileQuestion className="mx-auto mb-5 h-14 w-14 text-primary-700" aria-hidden="true" />
        <p className="eyebrow">Error 404</p>
        <h1 className="page-title mt-2">Page not found</h1>
        <p className="page-subtitle mx-auto">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link to="/dashboard" className="mt-8 inline-flex">
          <Button>Go to dashboard</Button>
        </Link>
      </section>
    </main>
  );
}
