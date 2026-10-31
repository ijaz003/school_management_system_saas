import { GraduationCap } from 'lucide-react';
import { LoginForm } from '../components/LoginForm';

export function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas p-4 sm:p-6">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(900px 420px at 12% -10%, rgb(13 148 136 / 0.16), transparent 55%), radial-gradient(700px 380px at 100% 0%, rgb(15 23 42 / 0.06), transparent 50%)',
        }}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md">
        <header className="mb-8 text-center">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-700 text-white shadow-[var(--shadow-lift)]">
            <GraduationCap className="h-7 w-7" aria-hidden="true" />
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-950">
            SchoolSaaS
          </h1>
          <p className="mt-1 text-sm text-ink-500">Sign in to your workspace</p>
        </header>
        <section className="panel p-6 sm:p-8">
          <LoginForm />
        </section>
        <p className="mt-6 text-center text-xs text-ink-400">
          Secure login powered by SchoolSaaS
        </p>
      </div>
    </main>
  );
}
