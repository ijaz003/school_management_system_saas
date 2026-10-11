import { GraduationCap } from 'lucide-react';
import { LoginForm } from '../components/LoginForm';

export function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
      <div className="w-full max-w-md">
        <header className="mb-8 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/20">
            <GraduationCap className="h-9 w-9 text-white" aria-hidden="true" />
          </div>
          <h1 className="mb-1 text-2xl font-bold text-gray-900">SchoolSaaS</h1>
          <p className="text-sm text-gray-500">Sign in to your account</p>
        </header>
        <section className="rounded-2xl border border-gray-100 bg-white p-8 shadow-xl">
          <LoginForm />
        </section>
        <p className="mt-6 text-center text-xs text-gray-400">Secure login powered by SchoolSaaS</p>
      </div>
    </main>
  );
}
