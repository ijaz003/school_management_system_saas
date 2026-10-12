import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCreateStaff } from '../hooks/useCreateStaff';
import { useUpdateStaff } from '../hooks/useUpdateStaff';
import type { StaffMember } from '../hooks/useStaff';
import { RoleSelect } from './RoleSelect';

const staffSchema = z.object({
  fullName: z.string().trim().min(2, 'Name must be at least 2 characters').max(200),
  email: z.string().trim().email('Enter a valid email'),
  phone: z.string().trim().min(10, 'Phone must be at least 10 digits').max(20),
  roleId: z.union([z.string().uuid(), z.literal('')]).optional(),
  subject: z.string().trim().max(100).optional(),
  joiningDate: z.string().optional(),
  sendEmail: z.boolean().optional(),
});

type FormData = z.infer<typeof staffSchema>;

export function StaffForm({
  staff,
  onSuccess,
  onCancel,
}: {
  staff?: StaffMember;
  onSuccess?: (result?: { tempPassword: string; email: string }) => void;
  onCancel?: () => void;
}) {
  const isEdit = Boolean(staff);
  const createStaff = useCreateStaff();
  const updateStaff = useUpdateStaff();
  const {
    register,
    handleSubmit,
    control,
    setValue,
    setError,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      fullName: staff?.fullName ?? '',
      email: staff?.email ?? '',
      phone: staff?.phone ?? '',
      roleId: staff?.roleId ?? '',
      subject: staff?.metadata?.subject ?? '',
      joiningDate: '',
      sendEmail: false,
    },
  });
  const roleId = useWatch({ control, name: 'roleId' });
  const pending = createStaff.isPending || updateStaff.isPending;

  const submit = (data: FormData) => {
    if (staff) {
      updateStaff.mutate(
        {
          id: staff.id,
          data: {
            fullName: data.fullName,
            phone: data.phone,
            ...(data.roleId && data.roleId !== staff.roleId ? { roleId: data.roleId } : {}),
            subject: data.subject,
          },
        },
        { onSuccess: () => onSuccess?.() },
      );
      return;
    }

    const roleId = data.roleId;
    if (!roleId) {
      setError('roleId', { message: 'Please select a role' });
      return;
    }

    createStaff.mutate({ ...data, roleId }, {
      onSuccess: (result) => onSuccess?.({
        tempPassword: result.tempPassword,
        email: result.staff.email,
      }),
    });
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-5">
      <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="text-base font-semibold text-gray-900">Personal information</h2>
        <Input label="Full name *" placeholder="e.g. Sir Zaid Ahmed" error={errors.fullName?.message} {...register('fullName')} />
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Email *"
            type="email"
            autoComplete="email"
            placeholder="staff@example.com"
            error={errors.email?.message}
            disabled={isEdit}
            {...register('email')}
          />
          <Input label="Phone *" type="tel" placeholder="03001234567" error={errors.phone?.message} {...register('phone')} />
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="text-base font-semibold text-gray-900">Role and position</h2>
        <RoleSelect
          value={roleId ?? ''}
          onChange={(value) => setValue('roleId', value, { shouldValidate: true })}
          error={errors.roleId?.message}
        />
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Subject" placeholder="e.g. Mathematics" error={errors.subject?.message} {...register('subject')} />
          {!isEdit && (
            <Input label="Joining date" type="date" error={errors.joiningDate?.message} {...register('joiningDate')} />
          )}
        </div>
      </section>

      {!isEdit && (
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 bg-white p-4">
          <input type="checkbox" className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" {...register('sendEmail')} />
          <span>
            <span className="block text-sm font-medium text-gray-900">Send welcome email</span>
            <span className="mt-0.5 block text-xs text-gray-500">
              Email delivery is not configured yet; a temporary password will be displayed after creation.
            </span>
          </span>
        </label>
      )}

      <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
        {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}
        <Button
          type="submit"
          isLoading={pending}
          disabled={pending}
        >
          {isEdit ? 'Save changes' : 'Create staff'}
        </Button>
      </div>
    </form>
  );
}
