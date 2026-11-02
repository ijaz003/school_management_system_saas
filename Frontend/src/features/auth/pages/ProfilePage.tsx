import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  User as UserIcon,
  Lock,
  Eye,
  EyeOff,
  Mail,
  Shield,
  Check,
  AlertCircle,
  KeyRound,
  Sparkles,
  BadgeCheck,
  Save,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectUser } from '@/store/selectors/permissions';
import { setUser, type User } from '@/store/slices/auth.slice';

/* ---------- schemas ---------- */

const profileSchema = z.object({
  fullName: z.string().trim().min(2, 'Name is too short').max(200),
  phone: z
    .string()
    .trim()
    .min(7, 'Enter a valid phone')
    .max(20)
    .optional()
    .or(z.literal('')),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(6, 'Password is too short'),
    newPassword: z.string().min(6, 'At least 6 characters').max(100),
    confirmPassword: z.string().min(6).max(100),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different',
    path: ['newPassword'],
  });

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;
type Tab = 'profile' | 'security';

/* ---------- helpers ---------- */

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function passwordScore(value: string) {
  let score = 0;
  if (value.length >= 6) score += 1;
  if (value.length >= 10) score += 1;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1;
  if (/\d/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;
  return Math.min(score, 5);
}

const STRENGTH = [
  { label: 'Too short', tone: 'bg-ink-200', text: 'text-ink-400', ring: 'ring-ink-100' },
  { label: 'Very weak', tone: 'bg-rose-500', text: 'text-rose-600', ring: 'ring-rose-100' },
  { label: 'Weak', tone: 'bg-orange-500', text: 'text-orange-600', ring: 'ring-orange-100' },
  { label: 'Fair', tone: 'bg-amber-500', text: 'text-amber-600', ring: 'ring-amber-100' },
  { label: 'Good', tone: 'bg-sky-500', text: 'text-sky-600', ring: 'ring-sky-100' },
  { label: 'Strong', tone: 'bg-emerald-500', text: 'text-emerald-600', ring: 'ring-emerald-100' },
] as const;

const RULES = [
  { id: 'len', label: 'At least 6 characters', test: (v: string) => v.length >= 6 },
  { id: 'case', label: 'Upper & lowercase letters', test: (v: string) => /[A-Z]/.test(v) && /[a-z]/.test(v) },
  { id: 'num', label: 'At least one number', test: (v: string) => /\d/.test(v) },
  { id: 'sym', label: 'At least one symbol', test: (v: string) => /[^A-Za-z0-9]/.test(v) },
];

/* ---------- page ---------- */

export function ProfilePage() {
  const user = useAppSelector(selectUser);
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<Tab>('profile');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: user?.fullName ?? '', phone: '' },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const newPassword = passwordForm.watch('newPassword') ?? '';
  const score = useMemo(() => passwordScore(newPassword), [newPassword]);
  const strength = STRENGTH[score];
  const rulesMet = RULES.map((rule) => ({ ...rule, ok: rule.test(newPassword) }));

  useEffect(() => {
    if (user) {
      profileForm.reset({ fullName: user.fullName, phone: user.phone ?? '' });
    }
  }, [profileForm, user]);

  const updateProfile = useMutation({
    mutationFn: async (data: ProfileForm) => {
      const response = await api.patch<User>('/auth/profile', {
        fullName: data.fullName,
        phone: data.phone || null,
      });
      if (!response.data) throw new Error('Profile was not updated');
      return response.data;
    },
    onSuccess: (updated) => {
      toast.success('Profile updated');
      dispatch(
        setUser({
          id: updated.id,
          email: updated.email,
          fullName: updated.fullName,
          phone: updated.phone ?? null,
          role: updated.role,
          roleId: updated.roleId,
          tenantId: updated.tenantId,
          permissions: updated.permissions,
          avatarUrl: updated.avatarUrl,
          tenantLocale: updated.tenantLocale ?? user?.tenantLocale ?? null,
        }),
      );
      void queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
    onError: (error: Error) =>
      toast.error(error.message || 'Failed to update profile'),
  });

  const changePassword = useMutation({
    mutationFn: async (data: PasswordForm) => {
      await api.post('/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
    },
    onSuccess: () => {
      toast.success('Password changed');
      passwordForm.reset();
    },
    onError: (error: Error) =>
      toast.error(error.message || 'Failed to change password'),
  });

  if (!user) {
    return (
      <AppLayout>
        <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-20 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ink-100 text-ink-500">
            <UserIcon className="h-5 w-5" aria-hidden />
          </span>
          <p className="text-sm text-ink-700">You need to be signed in.</p>
        </div>
      </AppLayout>
    );
  }

  const roleLabel = user.role.replaceAll('_', ' ');
  const dirty = profileForm.formState.isDirty;

  return (
    <AppLayout>
      <div className="relative mx-auto max-w-5xl space-y-6 pb-12">
        {/* ambient background */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-32 right-0 h-72 w-72 rounded-full bg-primary-200/20 blur-3xl" />
          <div className="absolute -top-20 left-8 h-56 w-56 rounded-full bg-violet-200/20 blur-3xl" />
        </div>

        {/* ---------- Hero identity banner ---------- */}
        <div className="relative overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_40px_-12px_rgba(15,23,42,0.08)]">
          <div className="relative h-32 bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-700 sm:h-36">
            <div
              aria-hidden
              className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.3)_1px,transparent_0)] [background-size:16px_16px]"
            />
            <div
              aria-hidden
              className="absolute -top-16 right-1/4 h-40 w-40 rounded-full bg-white/20 blur-2xl"
            />
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent to-white" />
          </div>

          <div className="relative -mt-14 px-5 pb-6 sm:px-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-4">
                <div className="relative">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-800 text-xl font-bold tracking-wider text-white shadow-xl ring-4 ring-white">
                    {initials(user.fullName)}
                  </div>
                  <span
                    aria-label="Account active"
                    className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-emerald-500"
                  >
                    <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-60" />
                    <Check className="relative h-2.5 w-2.5 text-white" strokeWidth={3} aria-hidden />
                  </span>
                </div>

                <div className="min-w-0 pb-1">
                  <p className="font-display text-lg font-semibold tracking-tight text-ink-950">
                    {user.fullName}
                  </p>
                  <p className="flex items-center gap-1.5 truncate text-[13px] text-ink-500">
                    <Mail className="h-3 w-3 shrink-0" aria-hidden />
                    {user.email}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 sm:pb-1">
                <Badge
                  tone="primary"
                  className="rounded-md px-2.5 py-1 text-[11px] font-medium capitalize tracking-tight"
                >
                  <Shield className="mr-1 h-3 w-3" aria-hidden />
                  {roleLabel}
                </Badge>
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-100">
                  <BadgeCheck className="h-3 w-3" aria-hidden />
                  Verified
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ---------- Tabs ---------- */}
        <div
          role="tablist"
          aria-label="Profile sections"
          className="inline-flex items-center gap-1 rounded-xl border border-ink-100 bg-white p-1 shadow-sm"
        >
          <TabButton
            active={tab === 'profile'}
            onClick={() => setTab('profile')}
            icon={<UserIcon className="h-3.5 w-3.5" aria-hidden />}
            controls="panel-profile"
            id="tab-profile"
          >
            Profile
          </TabButton>
          <TabButton
            active={tab === 'security'}
            onClick={() => setTab('security')}
            icon={<KeyRound className="h-3.5 w-3.5" aria-hidden />}
            controls="panel-security"
            id="tab-security"
          >
            Security
          </TabButton>
        </div>

        {/* ---------- Panels ---------- */}
        {tab === 'profile' && (
          <section
            id="panel-profile"
            role="tabpanel"
            aria-labelledby="tab-profile"
            className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_28px_-12px_rgba(15,23,42,0.08)]"
          >
            <SectionHeader
              icon={<UserIcon className="h-4 w-4" aria-hidden />}
              eyebrow="Personal details"
              title="How you appear across the app"
              description="Your name appears on invoices, receipts, and audit trails."
            />

            <form
              className="space-y-6 px-5 pb-5 pt-5 sm:px-7 sm:pb-7"
              onSubmit={profileForm.handleSubmit((data) => updateProfile.mutate(data))}
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="relative">
                  <Input
                    label="Full name"
                    required
                    autoComplete="name"
                    placeholder="Jane Doe"
                    error={profileForm.formState.errors.fullName?.message}
                    {...profileForm.register('fullName')}
                  />
                  {profileForm.formState.isValidating && (
                    <FieldStatus state="checking" />
                  )}
                </div>

                <div>
                  <Input label="Email" value={user.email} disabled autoComplete="email" />
                  <p className="mt-1.5 flex items-center gap-1 text-[11px] text-ink-400">
                    <Lock className="h-2.5 w-2.5" aria-hidden />
                    Contact an admin to change your email.
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <Input
                    label="Phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="+1 555 123 4567"
                    error={profileForm.formState.errors.phone?.message}
                    {...profileForm.register('phone')}
                  />
                </div>
              </div>

              <FormFooter>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() =>
                    profileForm.reset({
                      fullName: user.fullName,
                      phone: user.phone ?? '',
                    })
                  }
                  disabled={!dirty || updateProfile.isPending}
                  className="text-ink-500 hover:text-ink-900"
                >
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                  Reset
                </Button>
                <Button
                  type="submit"
                  isLoading={updateProfile.isPending}
                  disabled={!dirty || updateProfile.isPending}
                  className="transition-transform duration-150 active:scale-[0.98]"
                >
                  <Save className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                  Save changes
                </Button>
              </FormFooter>
            </form>
          </section>
        )}

        {tab === 'security' && (
          <section
            id="panel-security"
            role="tabpanel"
            aria-labelledby="tab-security"
            className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_28px_-12px_rgba(15,23,42,0.08)]"
          >
            <SectionHeader
              icon={<KeyRound className="h-4 w-4" aria-hidden />}
              eyebrow="Security"
              title="Change your password"
              description="Use a strong, unique password you don't reuse elsewhere."
            />

            <form
              className="space-y-6 px-5 pb-5 pt-5 sm:px-7 sm:pb-7"
              onSubmit={passwordForm.handleSubmit((data) => changePassword.mutate(data))}
            >
              <PasswordField
                id="currentPassword"
                label="Current password"
                autoComplete="current-password"
                show={showCurrent}
                onToggle={() => setShowCurrent((v) => !v)}
                error={passwordForm.formState.errors.currentPassword?.message}
                {...passwordForm.register('currentPassword')}
              />

              <div className="space-y-3">
                <PasswordField
                  id="newPassword"
                  label="New password"
                  autoComplete="new-password"
                  show={showNew}
                  onToggle={() => setShowNew((v) => !v)}
                  error={passwordForm.formState.errors.newPassword?.message}
                  {...passwordForm.register('newPassword')}
                />

                {/* Strength meter + rules */}
                <div className="rounded-xl border border-ink-100 bg-ink-50/50 p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                      Password strength
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10.5px] font-semibold ring-1 ring-inset ${strength.text} ${strength.ring} bg-white`}
                    >
                      {score === 0 ? '—' : strength.label}
                    </span>
                  </div>

                  <div
                    role="meter"
                    aria-valuemin={0}
                    aria-valuemax={5}
                    aria-valuenow={score}
                    aria-valuetext={score === 0 ? 'Empty' : strength.label}
                    aria-label="Password strength"
                    className="flex gap-1"
                  >
                    {[0, 1, 2, 3, 4].map((index) => (
                      <div
                        key={index}
                        className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                          index < score ? strength.tone : 'bg-ink-200/60'
                        }`}
                      />
                    ))}
                  </div>

                  <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
                    {rulesMet.map((rule) => (
                      <li
                        key={rule.id}
                        className={`flex items-center gap-1.5 text-[11.5px] transition-colors ${
                          rule.ok ? 'text-emerald-700' : 'text-ink-500'
                        }`}
                      >
                        <span
                          className={`flex h-3.5 w-3.5 items-center justify-center rounded-full transition-colors ${
                            rule.ok
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-ink-100 text-ink-400'
                          }`}
                        >
                          <Check className="h-2 w-2" strokeWidth={3} aria-hidden />
                        </span>
                        {rule.label}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <PasswordField
                id="confirmPassword"
                label="Confirm new password"
                autoComplete="new-password"
                show={showConfirm}
                onToggle={() => setShowConfirm((v) => !v)}
                error={passwordForm.formState.errors.confirmPassword?.message}
                {...passwordForm.register('confirmPassword')}
              />

              <FormFooter>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => passwordForm.reset()}
                  disabled={!passwordForm.formState.isDirty || changePassword.isPending}
                  className="text-ink-500 hover:text-ink-900"
                >
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                  Clear
                </Button>
                <Button
                  type="submit"
                  variant="outline"
                  isLoading={changePassword.isPending}
                  className="transition-transform duration-150 active:scale-[0.98]"
                >
                  <ShieldCheck className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                  Update password
                </Button>
              </FormFooter>
            </form>
          </section>
        )}

        {/* Footer note */}
        <div className="flex items-center justify-center gap-1.5 pt-2 text-[11px] text-ink-400">
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          <span>Changes are saved instantly and logged in your audit trail.</span>
        </div>
      </div>
    </AppLayout>
  );
}

/* ---------- small components ---------- */

function TabButton({
  active,
  onClick,
  icon,
  children,
  controls,
  id,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
  controls: string;
  id: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      id={id}
      aria-selected={active}
      aria-controls={controls}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition-all duration-150 ${
        active
          ? 'bg-primary-600 text-white shadow-sm'
          : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900'
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function SectionHeader({
  icon,
  eyebrow,
  title,
  description,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="border-b border-ink-100 bg-gradient-to-r from-ink-50/60 via-transparent to-transparent px-5 py-4 sm:px-7">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-primary-700 shadow-sm ring-1 ring-ink-100">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-primary-600">
            {eyebrow}
          </p>
          <h2 className="font-display text-[15px] font-semibold tracking-tight text-ink-950">
            {title}
          </h2>
          <p className="mt-0.5 text-[12px] leading-relaxed text-ink-500">{description}</p>
        </div>
      </div>
    </div>
  );
}

function FormFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="-mx-5 -mb-5 flex flex-wrap items-center justify-end gap-2 border-t border-ink-100 bg-ink-50/40 px-5 py-3 sm:-mx-7 sm:-mb-7 sm:px-7">
      {children}
    </div>
  );
}

function FieldStatus({ state }: { state: 'checking' | 'valid' }) {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute right-3 top-[28px] flex h-4 w-4 items-center justify-center"
    >
      {state === 'checking' ? (
        <span className="h-3 w-3 animate-spin rounded-full border-2 border-ink-200 border-t-primary-500" />
      ) : (
        <Check className="h-4 w-4 text-emerald-500" />
      )}
    </span>
  );
}

function PasswordField({
  id,
  label,
  show,
  onToggle,
  error,
  autoComplete,
  ...rest
}: {
  id: string;
  label: string;
  show: boolean;
  onToggle: () => void;
  error?: string;
  autoComplete?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1.5">
      <div className="relative">
        <Input
          id={id}
          label={label}
          required
          type={show ? 'text' : 'password'}
          autoComplete={autoComplete}
          error={error}
          className="pr-10"
          {...rest}
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={show ? 'Hide password' : 'Show password'}
          aria-pressed={show}
          className="absolute right-2 top-[26px] flex h-7 w-7 items-center justify-center rounded-md text-ink-400 transition hover:bg-ink-50 hover:text-ink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200"
        >
          <span className="transition-transform duration-150">
            {show ? (
              <EyeOff className="h-4 w-4" aria-hidden />
            ) : (
              <Eye className="h-4 w-4" aria-hidden />
            )}
          </span>
        </button>
      </div>
      {error && (
        <p className="flex items-center gap-1 text-[11px] font-medium text-danger-600">
          <AlertCircle className="h-3 w-3 shrink-0" aria-hidden />
          {error}
        </p>
      )}
    </div>
  );
}