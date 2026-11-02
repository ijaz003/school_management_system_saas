import { useEffect, type ReactNode } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Building2,
  CreditCard,
  GraduationCap,
  Phone,
  RotateCcw,
  Save,
  Settings2,
  Shield,
  UserRound,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MetricCard, MetricGrid } from '@/components/ui/metric-card';
import { PageShell } from '@/components/ui/page-shell';
import { PageLoader } from '@/components/ui/spinner';
import { useSchoolSettings, useUpdateSchoolSettings } from '../hooks/useSchoolSettings';

const schema = z.object({
  name: z.string().trim().min(2).max(200),
  city: z.string().trim().max(100).optional(),
  address: z.string().trim().max(500).optional(),
  logoUrl: z.string().trim().url('Enter a valid URL').optional().or(z.literal('')),
  ownerName: z.string().trim().min(2).max(200),
  ownerPhone: z.string().trim().min(7).max(20),
  academicYear: z.string().trim().max(50).optional(),
  gradingSystem: z.string().trim().max(50).optional(),
  timezone: z.string().trim().max(80).optional(),
  currency: z.string().trim().max(10).optional(),
  cardAttendanceEnabled: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

export function SchoolSettingsPage() {
  const settingsQuery = useSchoolSettings();
  const updateSettings = useUpdateSchoolSettings();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const cardAttendanceEnabled = watch('cardAttendanceEnabled');
  const logoUrl = watch('logoUrl');
  const schoolName = watch('name');

  useEffect(() => {
    if (!settingsQuery.data) return;
    const data = settingsQuery.data;
    reset({
      name: data.name,
      city: data.city ?? '',
      address: data.address ?? '',
      logoUrl: data.logoUrl ?? '',
      ownerName: data.ownerName,
      ownerPhone: data.ownerPhone,
      academicYear: data.settings.academicYear ?? '',
      gradingSystem: data.settings.gradingSystem ?? '',
      timezone: data.settings.timezone ?? '',
      currency: data.settings.currency ?? '',
      cardAttendanceEnabled: Boolean(data.settings.cardAttendanceEnabled),
    });
  }, [reset, settingsQuery.data]);

  if (settingsQuery.isPending) {
    return (
      <AppLayout>
        <PageShell eyebrow="Administration" title="School settings" description="Loading…">
          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-ink-100">
            <PageLoader compact />
          </div>
        </PageShell>
      </AppLayout>
    );
  }

  if (settingsQuery.error || !settingsQuery.data) {
    return (
      <AppLayout>
        <PageShell
          eyebrow="Administration"
          title="School settings"
          description="Update school profile and academic defaults."
        >
          <section className="rounded-2xl border border-danger-100 bg-white p-8 text-center shadow-sm">
            <h2 className="font-display font-semibold text-ink-950">Could not load settings</h2>
            <p className="mt-2 text-sm text-ink-600">
              {settingsQuery.error?.message ?? 'Settings were unavailable.'}
            </p>
            <Button
              className="mt-4"
              variant="outline"
              onClick={() => void settingsQuery.refetch()}
              isLoading={settingsQuery.isFetching}
            >
              Try again
            </Button>
          </section>
        </PageShell>
      </AppLayout>
    );
  }

  const school = settingsQuery.data;

  const onSubmit = (data: FormData) => {
    updateSettings.mutate({
      name: data.name,
      city: data.city || null,
      address: data.address || null,
      logoUrl: data.logoUrl || null,
      ownerName: data.ownerName,
      ownerPhone: data.ownerPhone,
      settings: {
        academicYear: data.academicYear || undefined,
        gradingSystem: data.gradingSystem || undefined,
        timezone: data.timezone || undefined,
        currency: data.currency || undefined,
        cardAttendanceEnabled: Boolean(data.cardAttendanceEnabled),
      },
    });
  };

  const resetForm = () => {
    reset({
      name: school.name,
      city: school.city ?? '',
      address: school.address ?? '',
      logoUrl: school.logoUrl ?? '',
      ownerName: school.ownerName,
      ownerPhone: school.ownerPhone,
      academicYear: school.settings.academicYear ?? '',
      gradingSystem: school.settings.gradingSystem ?? '',
      timezone: school.settings.timezone ?? '',
      currency: school.settings.currency ?? '',
      cardAttendanceEnabled: Boolean(school.settings.cardAttendanceEnabled),
    });
  };

  return (
    <AppLayout>
      <PageShell
        eyebrow="Administration"
        title="School settings"
        description="Update school profile, owner contact, and academic defaults."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={!isDirty || updateSettings.isPending}
              onClick={resetForm}
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" /> Reset
            </Button>
            <Button
              type="button"
              disabled={!isDirty || updateSettings.isPending}
              isLoading={updateSettings.isPending}
              onClick={() => void handleSubmit(onSubmit)()}
            >
              <Save className="h-4 w-4" aria-hidden="true" /> Save settings
            </Button>
          </div>
        }
      >
        <MetricGrid>
          <MetricCard
            icon={<Building2 className="h-4 w-4" aria-hidden="true" />}
            label="School"
            value={school.name}
            tone="primary"
          />
          <MetricCard
            icon={<Shield className="h-4 w-4" aria-hidden="true" />}
            label="Plan"
            value={school.plan}
            tone="success"
          />
          <MetricCard
            icon={<GraduationCap className="h-4 w-4" aria-hidden="true" />}
            label="Student limit"
            value={school.maxStudents}
            tone="neutral"
          />
          <MetricCard
            icon={<UserRound className="h-4 w-4" aria-hidden="true" />}
            label="Staff limit"
            value={school.maxTeachers}
            tone="warning"
          />
        </MetricGrid>

        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="neutral" className="font-mono normal-case">
            {school.slug}
          </Badge>
          <Badge tone={school.status === 'active' || school.status === 'trial' ? 'success' : 'warning'}>
            {school.status}
          </Badge>
          {school.settings.cardAttendanceEnabled ? (
            <Badge tone="primary">Card attendance on</Badge>
          ) : (
            <Badge tone="neutral">Card attendance off</Badge>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <SettingsSection
            icon={<Building2 className="h-4 w-4" aria-hidden="true" />}
            title="School profile"
            description="Public school identity shown across the workspace."
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-ink-50 ring-1 ring-ink-100">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={schoolName || school.name}
                    className="h-full w-full object-cover"
                    onError={(event) => {
                      event.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <Building2 className="h-7 w-7 text-ink-400" aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-4">
                <Input label="School name *" error={errors.name?.message} {...register('name')} />
                <Input
                  label="Logo URL"
                  error={errors.logoUrl?.message}
                  placeholder="https://…"
                  {...register('logoUrl')}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="City" placeholder="City" {...register('city')} />
              <Input label="Owner email" value={school.ownerEmail} disabled />
            </div>

            <div>
              <label
                htmlFor="school-address"
                className="mb-1.5 block text-sm font-medium text-ink-800"
              >
                Address
              </label>
              <textarea
                id="school-address"
                rows={3}
                className="field-select min-h-[5.5rem] resize-y"
                placeholder="Street, area, city"
                {...register('address')}
              />
            </div>
          </SettingsSection>

          <SettingsSection
            icon={<Phone className="h-4 w-4" aria-hidden="true" />}
            title="Owner contact"
            description="Primary contact for billing and school administration."
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Owner name *"
                error={errors.ownerName?.message}
                {...register('ownerName')}
              />
              <Input
                label="Owner phone *"
                error={errors.ownerPhone?.message}
                {...register('ownerPhone')}
              />
            </div>
          </SettingsSection>

          <SettingsSection
            icon={<Settings2 className="h-4 w-4" aria-hidden="true" />}
            title="Academic defaults"
            description="Defaults used across reports, fees, and academic screens."
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Academic year"
                placeholder="2025-2026"
                {...register('academicYear')}
              />
              <Input
                label="Grading system"
                placeholder="Percentage"
                {...register('gradingSystem')}
              />
              <Input label="Timezone" placeholder="Asia/Karachi" {...register('timezone')} />
              <Input label="Currency" placeholder="PKR" {...register('currency')} />
            </div>
          </SettingsSection>

          <SettingsSection
            icon={<CreditCard className="h-4 w-4" aria-hidden="true" />}
            title="Card attendance"
            description="Optional QR/barcode scan station for marking present with student ID cards."
          >
            <label className="flex items-start gap-3 rounded-xl border border-ink-100 bg-ink-50/60 px-4 py-3.5 text-sm transition hover:border-primary-200 hover:bg-primary-50/30">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-ink-300"
                checked={Boolean(cardAttendanceEnabled)}
                onChange={(event) =>
                  setValue('cardAttendanceEnabled', event.target.checked, { shouldDirty: true })
                }
              />
              <span>
                <span className="block font-medium text-ink-900">Enable card scan attendance</span>
                <span className="mt-1 block text-ink-500">
                  When on, staff can open Attendance → Scan station and mark present via card QR.
                </span>
              </span>
            </label>
          </SettingsSection>

          <footer className="sticky bottom-3 z-10 flex flex-col gap-3 rounded-2xl bg-white/95 p-3 shadow-sm ring-1 ring-ink-100 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-4">
            <p className="text-sm text-ink-500">
              {isDirty ? 'You have unsaved changes.' : 'All changes are saved.'}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={!isDirty || updateSettings.isPending}
                onClick={resetForm}
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" /> Reset
              </Button>
              <Button type="submit" disabled={!isDirty} isLoading={updateSettings.isPending}>
                <Save className="h-4 w-4" aria-hidden="true" /> Save settings
              </Button>
            </div>
          </footer>
        </form>
      </PageShell>
    </AppLayout>
  );
}

function SettingsSection({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-ink-100">
      <header className="flex items-start gap-3 border-b border-ink-100 px-4 py-4 sm:px-5">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
          {icon}
        </span>
        <div>
          <h2 className="font-display text-base font-semibold text-ink-950">{title}</h2>
          <p className="mt-0.5 text-sm text-ink-500">{description}</p>
        </div>
      </header>
      <div className="space-y-4 px-4 py-4 sm:px-5 sm:py-5">{children}</div>
    </section>
  );
}
