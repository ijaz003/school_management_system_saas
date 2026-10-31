import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCreateClass } from '../hooks/useCreateClass';

const classSchema = z.object({
  name: z.string().trim().min(1, 'Class name is required').max(50),
  order: z.number().int().min(1, 'Level must be at least 1').max(20, 'Level cannot exceed 20'),
  type: z.enum(['common', 'streamed']),
  description: z.string().trim().max(500).optional(),
});
type FormData = z.infer<typeof classSchema>;

export function ClassForm({ onSuccess, onCancel }: { onSuccess?: () => void; onCancel?: () => void }) {
  const createClass = useCreateClass();
  const { register, handleSubmit, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(classSchema),
    defaultValues: { type: 'common', order: 1 },
  });
  const type = useWatch({ control, name: 'type' });

  return (
    <form onSubmit={handleSubmit((data) => createClass.mutate(data, { onSuccess }))} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <Input label="Class name *" placeholder="e.g. Class 6" error={errors.name?.message} {...register('name')} />
        <Input label="Level / order *" type="number" min={1} max={20} error={errors.order?.message} {...register('order', { valueAsNumber: true })} />
      </div>
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-gray-700">Curriculum type</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {([
            ['common', 'Common curriculum', 'Sections inherit the subjects assigned to this class.'],
            ['streamed', 'Streamed curriculum', 'Each section can use a different subject set.'],
          ] as const).map(([value, title, description]) => (
            <label key={value} className={`cursor-pointer rounded-xl border-2 p-4 ${type === value ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
              <input type="radio" value={value} className="sr-only" {...register('type')} />
              <span className="block text-sm font-semibold text-gray-900">{title}</span>
              <span className="mt-1 block text-xs text-gray-600">{description}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor="class-description" className="mb-1.5 block text-sm font-medium text-gray-700">Description</label>
        <textarea id="class-description" rows={3} maxLength={500} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" {...register('description')} />
      </div>
      <footer className="flex justify-end gap-3 border-t border-gray-200 pt-4">
        {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}
        <Button type="submit" isLoading={createClass.isPending} disabled={createClass.isPending}>Create class</Button>
      </footer>
    </form>
  );
}
