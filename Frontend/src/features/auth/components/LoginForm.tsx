import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Eye, EyeOff, Lock, Mail, School } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getTenantSlug } from '@/lib/api';
import { useLogin } from '../hooks/useLogin';

const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  tenantSlug: z.string().trim().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

const fieldClass =
  'h-12 w-full rounded-2xl border bg-surface-muted/70 px-3.5 text-sm text-ink-900 transition placeholder:text-ink-400 hover:border-ink-300 hover:bg-white focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/35 disabled:cursor-not-allowed disabled:bg-ink-50 disabled:text-ink-400';

export function LoginForm() {
  const login = useLogin();
  const queryTenant = getTenantSlug() ?? '';
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', tenantSlug: queryTenant },
  });

  const onSubmit = (data: LoginFormData) => {
    login.mutate({
      email: data.email,
      password: data.password,
      ...(data.tenantSlug ? { tenantSlug: data.tenantSlug } : {}),
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink-800">
          Email
        </label>
        <div className="relative">
          <Mail
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
            aria-hidden="true"
          />
          <input
            id="email"
            type="email"
            autoComplete="username"
            placeholder="you@school.edu"
            aria-invalid={Boolean(errors.email)}
            className={cn(
              fieldClass,
              'pl-10',
              errors.email ? 'border-danger-600 focus:ring-danger-600/30' : 'border-ink-200',
            )}
            {...register('email')}
          />
        </div>
        {errors.email ? (
          <p className="mt-1.5 text-xs text-danger-600">{errors.email.message}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ink-800">
          Password
        </label>
        <div className="relative">
          <Lock
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
            aria-hidden="true"
          />
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="Enter your password"
            aria-invalid={Boolean(errors.password)}
            className={cn(
              fieldClass,
              'pl-10 pr-11',
              errors.password ? 'border-danger-600 focus:ring-danger-600/30' : 'border-ink-200',
            )}
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            className="absolute right-1.5 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-ink-400 transition hover:bg-ink-100 hover:text-ink-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
        {errors.password ? (
          <p className="mt-1.5 text-xs text-danger-600">{errors.password.message}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="tenantSlug" className="mb-1.5 block text-sm font-medium text-ink-800">
          School slug
          <span className="ml-1 font-normal text-ink-400">(optional)</span>
        </label>
        <div className="relative">
          <School
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
            aria-hidden="true"
          />
          <input
            id="tenantSlug"
            autoComplete="organization"
            placeholder="e.g. greenfield-academy"
            aria-invalid={Boolean(errors.tenantSlug)}
            className={cn(
              fieldClass,
              'pl-10',
              errors.tenantSlug ? 'border-danger-600 focus:ring-danger-600/30' : 'border-ink-200',
            )}
            {...register('tenantSlug')}
          />
        </div>
        {errors.tenantSlug ? (
          <p className="mt-1.5 text-xs text-danger-600">{errors.tenantSlug.message}</p>
        ) : (
          <p className="mt-1.5 text-xs text-ink-500">
            Needed for school staff. Leave blank for platform admin.
          </p>
        )}
      </div>

      <div className="pt-2">
        <Button
          type="submit"
          size="lg"
          className="h-12 w-full rounded-2xl text-[0.95rem] shadow-[0_12px_28px_rgb(15_118_110/0.28)]"
          isLoading={login.isPending}
        >
          Enter workspace
          {!login.isPending ? <ArrowRight className="h-4 w-4" aria-hidden="true" /> : null}
        </Button>
      </div>
    </form>
  );
}
