import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useCreateSchool, type CreateSchoolResponse } from '../hooks/useCreateSchool';

const createSchoolSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(200),
  slug: z.string().trim().min(2).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and single hyphens'),
  ownerName: z.string().trim().min(2).max(200),
  ownerEmail: z.string().trim().email('Enter a valid email'),
  ownerPhone: z.string().trim().min(10).max(20),
  city: z.string().trim().max(100).optional(),
  address: z.string().trim().max(500).optional(),
  plan: z.enum(['basic', 'standard', 'premium']),
});

type FormData = z.infer<typeof createSchoolSchema>;

const plans = [
  { value: 'basic', label: 'Basic', description: '500 students, 50 teachers, 100 SMS' },
  { value: 'standard', label: 'Standard', description: '2,000 students, 200 teachers, 500 SMS' },
  { value: 'premium', label: 'Premium', description: 'Higher student, teacher and messaging limits' },
] as const;

export function SchoolForm() {
  const navigate = useNavigate();
  const createSchool = useCreateSchool();
  const [created, setCreated] = useState<CreateSchoolResponse | null>(null);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const { register, handleSubmit, control, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(createSchoolSchema),
    defaultValues: { plan: 'basic' },
  });
  const name = useWatch({ control, name: 'name' });
  const selectedPlan = useWatch({ control, name: 'plan' });
  const slugValue = useWatch({ control, name: 'slug' });
  const slugRegistration = register('slug');

  useEffect(() => {
    if (name && !slugManuallyEdited) {
      const slug = name.toLowerCase().trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      setValue('slug', slug, { shouldValidate: true });
    }
  }, [name, setValue, slugManuallyEdited]);

  const onSubmit = (data: FormData) => {
    createSchool.mutate(data, { onSuccess: setCreated });
  };

  const copyTemporaryPassword = async () => {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(created.admin.tempPassword);
      toast.success('Temporary password copied');
    } catch {
      toast.error('Could not copy password. Select and copy it manually.');
    }
  };

  if (created) {
    return (
      <Card className="max-w-2xl">
        <CardHeader><CardTitle>School created successfully</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="mb-2 text-sm font-medium text-amber-900">Temporary password — shown only once</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <code className="flex-1 break-all rounded border bg-white px-3 py-2 text-sm">{created.admin.tempPassword}</code>
              <Button type="button" variant="outline" size="sm" onClick={copyTemporaryPassword}>Copy</Button>
            </div>
            <p className="mt-2 text-xs text-amber-800">
              Admin account: {created.admin.email}. Share these credentials securely.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="button" onClick={() => navigate('/schools')}>Go to schools</Button>
            <Button type="button" variant="outline" onClick={() => setCreated(null)}>Create another school</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
      <Card>
        <CardHeader><CardTitle>School information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input label="School name *" placeholder="e.g. City School" error={errors.name?.message} {...register('name')} />
          <div>
            <Input
              label="School slug *"
              placeholder="e.g. city-school"
              error={errors.slug?.message}
              {...slugRegistration}
              onChange={(event) => {
                setSlugManuallyEdited(true);
                void slugRegistration.onChange(event);
              }}
            />
            {slugValue && <p className="mt-1 text-xs text-gray-500">School URL slug: <code>{slugValue}</code></p>}
          </div>
          <Input label="City" placeholder="e.g. Lahore" error={errors.city?.message} {...register('city')} />
          <Input label="Address" placeholder="Full address (optional)" error={errors.address?.message} {...register('address')} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>School administrator</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input label="Owner name *" placeholder="e.g. Ahmed Khan" error={errors.ownerName?.message} {...register('ownerName')} />
          <Input label="Email *" type="email" autoComplete="email" placeholder="owner@example.com" error={errors.ownerEmail?.message} {...register('ownerEmail')} />
          <Input label="Phone *" type="tel" placeholder="Phone number" error={errors.ownerPhone?.message} {...register('ownerPhone')} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Subscription plan</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {plans.map((plan) => (
            <label key={plan.value} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${selectedPlan === plan.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
              <input type="radio" value={plan.value} className="mt-1 text-blue-600 focus:ring-blue-500" {...register('plan')} />
              <span>
                <span className="block font-medium text-gray-900">{plan.label}</span>
                <span className="mt-1 block text-xs text-gray-500">{plan.description}</span>
              </span>
            </label>
          ))}
        </CardContent>
      </Card>
      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={() => navigate('/schools')}>Cancel</Button>
        <Button type="submit" isLoading={createSchool.isPending}>Create school</Button>
      </div>
    </form>
  );
}
