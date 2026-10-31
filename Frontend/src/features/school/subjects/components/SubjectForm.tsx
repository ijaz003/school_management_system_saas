import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCreateSubject } from '../hooks/useCreateSubject';

const subjectSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  code: z.string().trim().min(2, 'Code must be at least 2 characters').max(20).regex(/^[A-Z0-9]+$/, 'Use uppercase letters and numbers only'),
  description: z.string().trim().max(500).optional(),
  isElective: z.boolean(),
});

type FormData = z.infer<typeof subjectSchema>;

export function SubjectForm({ onSuccess, onCancel }: { onSuccess?: () => void; onCancel?: () => void }) {
  const createSubject = useCreateSubject();
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(subjectSchema),
    defaultValues: { isElective: false },
  });

  return (
    <form
      onSubmit={handleSubmit((data) => createSubject.mutate(data, { onSuccess }))}
      className="space-y-5"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label="Subject name *"
          placeholder="e.g. Mathematics"
          error={errors.name?.message}
          {...register('name', {
            onChange: (event) => {
              const code = event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
              if (code) setValue('code', code, { shouldValidate: true });
            },
          })}
        />
        <Input
          label="Code *"
          placeholder="e.g. MATH"
          error={errors.code?.message}
          {...register('code', { setValueAs: (value: string) => value.toUpperCase() })}
        />
      </div>
      <div>
        <label htmlFor="subject-description" className="mb-1.5 block text-sm font-medium text-ink-700">Description</label>
        <textarea
          id="subject-description"
          rows={3}
          maxLength={500}
          placeholder="Optional description..."
          className="field-select resize-y"
          {...register('description')}
        />
        {errors.description?.message && <p className="mt-1 text-xs text-danger-600">{errors.description.message}</p>}
      </div>
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-ink-200 bg-surface-muted p-4">
        <input type="checkbox" className="mt-1 h-4 w-4 rounded text-primary-700" {...register('isElective')} />
        <span><span className="block text-sm font-medium text-ink-950">Elective subject</span><span className="block text-xs text-ink-500">Students may choose whether to take this subject.</span></span>
      </label>
      <div className="flex justify-end gap-3 border-t border-ink-200 pt-4">
        {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}
        <Button type="submit" isLoading={createSubject.isPending} disabled={createSubject.isPending}>Create subject</Button>
      </div>
    </form>
  );
}
