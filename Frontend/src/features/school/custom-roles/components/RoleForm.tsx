import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCreateRole } from '../hooks/useCreateRole';
import { useUpdateRole } from '../hooks/useUpdateRole';
import type { Role } from '../hooks/useRoles';
import { PermissionPicker } from './PermissionPicker';

const roleSchema = z.object({
  name: z.string().trim().min(2, 'Role name must be at least 2 characters').max(50).regex(/^[a-z_]+$/, 'Use lowercase letters and underscores only'),
  displayName: z.string().trim().min(2, 'Enter a display name').max(100),
  description: z.string().trim().max(500).optional(),
});

type FormData = z.infer<typeof roleSchema>;

const COLORS = [
  { value: '#2563eb', label: 'Blue' },
  { value: '#16a34a', label: 'Green' },
  { value: '#9333ea', label: 'Purple' },
  { value: '#f59e0b', label: 'Orange' },
  { value: '#ec4899', label: 'Pink' },
  { value: '#06b6d4', label: 'Cyan' },
];

interface RoleFormProps {
  role?: Role;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function RoleForm({ role, onSuccess, onCancel }: RoleFormProps) {
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const [permissions, setPermissions] = useState(role?.permissions ?? []);
  const [selectedColor, setSelectedColor] = useState(role?.color ?? COLORS[0].value);
  const [permissionError, setPermissionError] = useState('');
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: role?.name ?? '',
      displayName: role?.displayName ?? '',
      description: role?.description ?? '',
    },
  });

  const isPending = createRole.isPending || updateRole.isPending;
  const createNameFromDisplay = (value: string) =>
    value.toLowerCase().trim().replace(/[^a-z\s]/g, '').replace(/\s+/g, '_');

  const submit = (data: FormData) => {
    if (permissions.length === 0) {
      setPermissionError('Select at least one permission.');
      return;
    }
    setPermissionError('');

    if (role) {
      updateRole.mutate(
        {
          id: role.id,
          data: {
            displayName: data.displayName,
            description: data.description ?? '',
            permissions,
            color: selectedColor,
          },
        },
        { onSuccess },
      );
      return;
    }

    createRole.mutate(
      {
        name: data.name,
        displayName: data.displayName,
        description: data.description,
        permissions,
        color: selectedColor,
      },
      { onSuccess },
    );
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-6">
      <section className="space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-5">
        <h3 className="text-sm font-semibold text-gray-900">Role information</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Input
              label="Role name *"
              placeholder="exam_coordinator"
              disabled={Boolean(role)}
              error={errors.name?.message}
              {...register('name')}
            />
            <p className="mt-1 text-xs text-gray-500">Lowercase letters and underscores only.</p>
          </div>
          <Input
            label="Display name *"
            placeholder="Exam Coordinator"
            error={errors.displayName?.message}
            {...register('displayName', {
              onChange: (event) => {
                if (!role) setValue('name', createNameFromDisplay(event.target.value), { shouldValidate: true });
              },
            })}
          />
        </div>
        <div>
          <label htmlFor="role-description" className="mb-1.5 block text-sm font-medium text-gray-700">Description</label>
          <textarea
            id="role-description"
            rows={3}
            maxLength={500}
            placeholder="Describe this role's responsibilities..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            {...register('description')}
          />
          {errors.description?.message && <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>}
        </div>
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-gray-700">Role color</legend>
          <div className="flex flex-wrap gap-3">
            {COLORS.map((color) => (
              <button
                key={color.value}
                type="button"
                aria-label={`${color.label}${selectedColor === color.value ? ', selected' : ''}`}
                aria-pressed={selectedColor === color.value}
                title={color.label}
                onClick={() => setSelectedColor(color.value)}
                className={`h-9 w-9 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 ${selectedColor === color.value ? 'ring-2 ring-offset-2 ring-gray-900' : ''}`}
                style={{ backgroundColor: color.value }}
              />
            ))}
          </div>
        </fieldset>
      </section>

      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Permissions</h3>
          <p className="mt-1 text-xs text-gray-500">Only permissions you are allowed to grant are shown.</p>
        </div>
        <PermissionPicker
          value={permissions}
          onChange={(value) => {
            setPermissions(value);
            if (value.length > 0) setPermissionError('');
          }}
          disabled={isPending}
        />
        {permissionError && <p className="text-sm text-red-600">{permissionError}</p>}
      </section>

      <footer className="flex justify-end gap-3 border-t border-gray-200 pt-4">
        {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}
        <Button type="submit" isLoading={isPending} disabled={isPending}>
          {role ? 'Save changes' : 'Create role'}
        </Button>
      </footer>
    </form>
  );
}
