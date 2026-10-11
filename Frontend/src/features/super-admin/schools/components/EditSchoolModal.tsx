import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUpdateSchool } from '../hooks/useUpdateSchool';
import type { School } from '../hooks/useSchools';

const editSchoolSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(200),
  city: z.string().trim().max(100),
  address: z.string().trim().max(500),
  plan: z.enum(['basic', 'standard', 'premium']),
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
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(editSchoolSchema),
    defaultValues: {
      name: school.name,
      city: school.city ?? '',
      address: school.address ?? '',
      plan: school.plan,
    },
  });

  useEffect(() => {
    reset({
      name: school.name,
      city: school.city ?? '',
      address: school.address ?? '',
      plan: school.plan,
    });
  }, [reset, school]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !updateSchool.isPending) onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, updateSchool.isPending]);

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
        },
      },
      { onSuccess: onClose },
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !updateSchool.isPending) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-school-title"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-xl"
      >
        <header className="flex items-center justify-between border-b border-gray-200 p-6">
          <h2 id="edit-school-title" className="text-lg font-semibold text-gray-900">
            Edit school
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={updateSchool.isPending}
            className="rounded-lg p-1 hover:bg-gray-100 disabled:opacity-50"
            aria-label="Close edit school dialog"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </header>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-6">
          <Input label="School name" error={errors.name?.message} {...register('name')} />
          <Input label="City" error={errors.city?.message} {...register('city')} />
          <Input label="Address" error={errors.address?.message} {...register('address')} />

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-gray-700">Plan</legend>
            <div className="space-y-2">
              {plans.map((plan) => (
                <label
                  key={plan.value}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-3"
                >
                  <input
                    type="radio"
                    value={plan.value}
                    className="text-blue-600"
                    {...register('plan')}
                  />
                  <span className="text-sm font-medium text-gray-900">{plan.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <p className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
            Slug and owner information cannot be changed here. Changing the plan updates
            the school&apos;s plan limits and permissions.
          </p>

          <footer className="flex gap-3 border-t border-gray-200 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={updateSchool.isPending}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={updateSchool.isPending} className="flex-1">
              Save changes
            </Button>
          </footer>
        </form>
      </section>
    </div>
  );
}
