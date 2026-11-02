import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { NativeSelect } from '@/components/ui/native-select';
import {
  DATE_FORMAT_OPTIONS,
  DEFAULT_DATE_FORMAT,
  DEFAULT_TIMEZONE,
  listTimeZones,
} from '@/lib/tenant-locale';
import { useUpdateSchool } from '../hooks/useUpdateSchool';
import type { School } from '../hooks/useSchools';

const TIMEZONES = listTimeZones();

const editSchoolSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(200),
  city: z.string().trim().max(100),
  address: z.string().trim().max(500),
  plan: z.enum(['basic', 'standard', 'premium']),
  timezone: z.string().trim().min(1).max(80),
  dateFormat: z.enum([
    'DD/MM/YYYY',
    'MM/DD/YYYY',
    'YYYY-MM-DD',
    'DD-MM-YYYY',
    'D MMM YYYY',
  ]),
});

type FormData = z.infer<typeof editSchoolSchema>;

interface EditSchoolModalProps {
  school: School;
  isOpen: boolean;
  onClose: () => void;
}

const plans = [
  { value: 'basic', label: 'Basic' },
  { value: 'standard', label: 'Standard' },
  { value: 'premium', label: 'Premium' },
] as const;

export function EditSchoolModal({ school, isOpen, onClose }: EditSchoolModalProps) {
  const updateSchool = useUpdateSchool();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(editSchoolSchema),
    defaultValues: {
      name: school.name,
      city: school.city ?? '',
      address: school.address ?? '',
      plan: school.plan,
      timezone: school.settings?.timezone || DEFAULT_TIMEZONE,
      dateFormat: (DATE_FORMAT_OPTIONS.find((o) => o.value === school.settings?.dateFormat)?.value ??
        DEFAULT_DATE_FORMAT) as FormData['dateFormat'],
    },
  });
  const selectedPlan = watch('plan');
  const selectedTimezone = watch('timezone');

  useEffect(() => {
    reset({
      name: school.name,
      city: school.city ?? '',
      address: school.address ?? '',
      plan: school.plan,
      timezone: school.settings?.timezone || DEFAULT_TIMEZONE,
      dateFormat: (DATE_FORMAT_OPTIONS.find((o) => o.value === school.settings?.dateFormat)?.value ??
        DEFAULT_DATE_FORMAT) as FormData['dateFormat'],
    });
  }, [reset, school]);

  if (!isOpen) return null;

  const onSubmit = (data: FormData) => {
    updateSchool.mutate(
      {
        id: school.id,
        data: {
          name: data.name,
          city: data.city || null,
          address: data.address || null,
          plan: data.plan,
          settings: {
            timezone: data.timezone,
            dateFormat: data.dateFormat,
          },
        },
      },
      { onSuccess: onClose },
    );
  };

  return (
    <Modal
      title="Edit school"
      size="md"
      onClose={onClose}
      closeDisabled={updateSchool.isPending}
      footer={(
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={updateSchool.isPending}>
            Cancel
          </Button>
          <Button type="submit" form="edit-school-form" isLoading={updateSchool.isPending}>
            Save changes
          </Button>
        </>
      )}
    >
      <form id="edit-school-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="School name" error={errors.name?.message} {...register('name')} />
        <Input label="City" error={errors.city?.message} {...register('city')} />
        <Input label="Address" error={errors.address?.message} {...register('address')} />

        <div className="grid gap-4 sm:grid-cols-2">
          <NativeSelect
            id="edit-school-timezone"
            label="Timezone"
            error={errors.timezone?.message}
            {...register('timezone')}
          >
            {selectedTimezone && !TIMEZONES.includes(selectedTimezone) ? (
              <option value={selectedTimezone}>{selectedTimezone}</option>
            ) : null}
            {TIMEZONES.map((zone) => (
              <option key={zone} value={zone}>
                {zone.replace(/_/g, ' ')}
              </option>
            ))}
          </NativeSelect>
          <NativeSelect
            id="edit-school-date-format"
            label="Date format"
            error={errors.dateFormat?.message}
            {...register('dateFormat')}
          >
            {DATE_FORMAT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label} — {option.example}
              </option>
            ))}
          </NativeSelect>
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-ink-800">Plan</legend>
          <div className="space-y-2">
            {plans.map((plan) => (
              <label
                key={plan.value}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors ${selectedPlan === plan.value ? 'border-primary-600 bg-primary-50' : 'border-ink-200 hover:border-ink-300'}`}
              >
                <input
                  type="radio"
                  value={plan.value}
                  className="text-primary-700 focus:ring-primary-500"
                  {...register('plan')}
                />
                <span className="text-sm font-medium text-ink-950">{plan.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <p className="rounded-xl border border-primary-200 bg-primary-50 p-3 text-xs text-primary-800">
          Slug and owner information cannot be changed here. Changing the plan updates
          limits and default permissions for the school admin.
        </p>
      </form>
    </Modal>
  );
}
