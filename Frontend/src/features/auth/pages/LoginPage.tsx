import { GraduationCap, ShieldCheck } from 'lucide-react';
import { LoginForm } from '../components/LoginForm';

const CAMPUS_IMAGE =
  'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=2200&q=80';

export function LoginPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-ink-950">
      {/* Full-bleed campus visual */}
      <div className="absolute inset-0" aria-hidden="true">
        <img
          src={CAMPUS_IMAGE}
          alt=""
          className="h-full w-full object-cover motion-safe:animate-[login-kenburns_28s_ease-in-out_infinite_alternate]"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-ink-950/90 via-primary-800/75 to-primary-700/50" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_20%,rgb(20_184_166/0.22),transparent_55%)]" />
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              'linear-gradient(rgb(255 255 255 / 0.35) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / 0.35) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
            maskImage: 'linear-gradient(to bottom, black, transparent 85%)',
          }}
        />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col justify-between gap-10 px-5 py-8 sm:px-8 lg:flex-row lg:items-center lg:gap-16 lg:px-12 lg:py-12">
        {/* Brand composition */}
        <section className="max-w-xl text-white lg:flex-1">
          <div
            className="inline-flex items-center gap-3 motion-safe:animate-fade-up"
            style={{ animationFillMode: 'both' }}
          >
            <span className="relative inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/12 shadow-[0_0_0_1px_rgb(255_255_255/0.22)] backdrop-blur-md">
              <span className="absolute inset-0 rounded-2xl bg-primary-400/20 blur-md" aria-hidden="true" />
              <GraduationCap className="relative h-7 w-7" aria-hidden="true" />
            </span>
            <div>
              <p className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                SchoolSaaS
              </p>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary-200/90">
                School management
              </p>
            </div>
          </div>

          <h1
            className="mt-10 font-display text-4xl font-semibold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[3.35rem] motion-safe:animate-fade-up"
            style={{ animationDelay: '90ms', animationFillMode: 'both' }}
          >
            The campus desk,
            <span className="block text-primary-200">quietly powerful.</span>
          </h1>

          <p
            className="mt-5 max-w-md text-base leading-relaxed text-white/72 sm:text-lg motion-safe:animate-fade-up"
            style={{ animationDelay: '160ms', animationFillMode: 'both' }}
          >
            One place for admissions, attendance, fees, exams, and daily diary —
            designed for how schools actually work.
          </p>

          <div
            className="mt-10 hidden h-px w-24 bg-gradient-to-r from-primary-300/80 to-transparent lg:block motion-safe:animate-fade-in"
            style={{ animationDelay: '240ms', animationFillMode: 'both' }}
            aria-hidden="true"
          />
        </section>

        {/* Sign-in card */}
        <section
          className="w-full max-w-[440px] shrink-0 motion-safe:animate-fade-up lg:ml-auto"
          style={{ animationDelay: '120ms', animationFillMode: 'both' }}
        >
          <div className="login-card relative overflow-hidden rounded-[1.75rem]">
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-primary-600 via-primary-500 to-primary-300"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute -left-16 top-24 h-40 w-40 rounded-full bg-primary-200/40 blur-3xl"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute -right-12 -top-8 h-36 w-36 rounded-full bg-primary-400/25 blur-3xl"
              aria-hidden="true"
            />

            <header className="relative border-b border-ink-100/90 px-6 pb-5 pt-7 sm:px-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-primary-700">
                    Staff access
                  </p>
                  <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink-950">
                    Sign in
                  </h2>
                  <p className="mt-1.5 max-w-[16rem] text-sm leading-relaxed text-ink-500">
                    Enter your school credentials to open the workspace.
                  </p>
                </div>
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary-700 ring-1 ring-primary-100">
                  <GraduationCap className="h-5 w-5" aria-hidden="true" />
                </span>
              </div>
            </header>

            <div className="relative px-6 py-6 sm:px-8 sm:py-7">
              <LoginForm />
            </div>

            <footer className="relative flex items-center justify-center gap-2 border-t border-ink-100/90 bg-surface-muted/80 px-6 py-3.5 text-xs text-ink-500 sm:px-8">
              <ShieldCheck className="h-3.5 w-3.5 text-primary-600" aria-hidden="true" />
              Secure school session
            </footer>
          </div>

          <p className="mt-5 text-center text-xs text-white/55">
            Authorized school accounts only
          </p>
        </section>
      </div>
    </main>
  );
}
