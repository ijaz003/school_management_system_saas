import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, Mail, School } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getTenantSlug } from '@/lib/api';
import { useLogin } from '../hooks/useLogin';

const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  tenantSlug: z.string().trim().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const login = useLogin();
  const queryTenant = getTenantSlug() ?? '';
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="relative">
        <label htmlFor="email" className="sr-only">Email address</label>
        <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
        <Input id="email" type="email" autoComplete="username" placeholder="Email address" className="pl-10" error={errors.email?.message} {...register('email')} />
      </div>
      <div className="relative">
        <label htmlFor="password" className="sr-only">Password</label>
        <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
        <Input id="password" type="password" autoComplete="current-password" placeholder="Password" className="pl-10" error={errors.password?.message} {...register('password')} />
      </div>
      <div className="relative">
        <label htmlFor="tenantSlug" className="sr-only">School slug</label>
        <School className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
        <Input id="tenantSlug" autoComplete="organization" placeholder="School slug (school accounts)" className="pl-10" error={errors.tenantSlug?.message} {...register('tenantSlug')} />
      </div>
      <Button type="submit" size="lg" className="w-full" isLoading={login.isPending}>
        Sign in
      </Button>
    </form>
  );
}
