import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
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
});

type FormData = z.infer<typeof schema>;

export function SchoolSettingsPage() {
  const settingsQuery = useSchoolSettings();
  const updateSettings = useUpdateSchoolSettings();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

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
    });
  }, [reset, settingsQuery.data]);

  if (settingsQuery.isPending) {
    return (
      <AppLayout>
        <div className="panel">
          <PageLoader compact />
        </div>
      </AppLayout>
    );
  }

  if (settingsQuery.error || !settingsQuery.data) {
    return (
      <AppLayout>
        <section className="panel p-8 text-center">
          <h1 className="font-display text-lg font-semibold text-ink-950">Could not load settings</h1>
          <p className="mt-2 text-sm text-ink-600">{settingsQuery.error?.message}</p>
        </section>
      </AppLayout>
    );
  }

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
      },
    });
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <PageHeader
          eyebrow="Settings"
          title="School settings"
          description={`Update school profile and academic defaults. Slug: ${settingsQuery.data.slug}`}
        />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <section className="panel space-y-4 p-4 sm:p-5">
            <h2 className="font-display text-base font-semibold text-ink-950">School profile</h2>
            <Input label="School name *" error={errors.name?.message} {...register('name')} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="City" {...register('city')} />
              <Input label="Logo URL" error={errors.logoUrl?.message} {...register('logoUrl')} />
            </div>
            <div>
              <label htmlFor="school-address" className="mb-1.5 block text-sm font-medium text-ink-800">
                Address
              </label>
              <textarea
                id="school-address"
                rows={2}
                className="field-select"
                {...register('address')}
              />
            </div>
          </section>

          <section className="panel space-y-4 p-4 sm:p-5">
            <h2 className="font-display text-base font-semibold text-ink-950">Owner contact</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Owner name *" error={errors.ownerName?.message} {...register('ownerName')} />
              <Input label="Owner phone *" error={errors.ownerPhone?.message} {...register('ownerPhone')} />
            </div>
            <Input label="Owner email" value={settingsQuery.data.ownerEmail} disabled />
          </section>

          <section className="panel space-y-4 p-4 sm:p-5">
            <h2 className="font-display text-base font-semibold text-ink-950">Academic defaults</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Academic year" placeholder="2025-2026" {...register('academicYear')} />
              <Input label="Grading system" placeholder="Percentage" {...register('gradingSystem')} />
              <Input label="Timezone" placeholder="Asia/Karachi" {...register('timezone')} />
              <Input label="Currency" placeholder="PKR" {...register('currency')} />
            </div>
          </section>

          <footer className="flex justify-stretch sm:justify-end">
            <Button type="submit" className="w-full sm:w-auto" isLoading={updateSettings.isPending}>
              Save settings
            </Button>
          </footer>
        </form>
      </div>
    </AppLayout>
  );
}
