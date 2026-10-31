import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectUser } from '@/store/selectors/permissions';
import { setUser, type User } from '@/store/slices/auth.slice';

const profileSchema = z.object({
  fullName: z.string().trim().min(2).max(200),
  phone: z.string().trim().min(7).max(20).optional().or(z.literal('')),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6).max(100),
  confirmPassword: z.string().min(6).max(100),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

export function ProfilePage() {
  const user = useAppSelector(selectUser);
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: user?.fullName ?? '', phone: '' },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  useEffect(() => {
    if (user) {
      profileForm.reset({
        fullName: user.fullName,
        phone: user.phone ?? '',
      });
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
      dispatch(setUser({
        id: updated.id,
        email: updated.email,
        fullName: updated.fullName,
        phone: updated.phone ?? null,
        role: updated.role,
        roleId: updated.roleId,
        tenantId: updated.tenantId,
        permissions: updated.permissions,
        avatarUrl: updated.avatarUrl,
      }));
      void queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to update profile'),
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
    onError: (error: Error) => toast.error(error.message || 'Failed to change password'),
  });

  if (!user) {
    return (
      <AppLayout>
        <p className="text-sm text-ink-700">You need to be signed in.</p>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        <PageHeader
          eyebrow="Account"
          title="My profile"
          description="Update your personal details and password."
        />

        <section className="panel p-4 sm:p-5">
          <div className="mb-5 flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-700 text-lg font-bold text-white">
              {user.fullName
                .split(/\s+/)
                .map((part) => part[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold text-ink-950">{user.fullName}</p>
              <p className="truncate text-sm text-ink-500">{user.email}</p>
              <Badge tone="primary" className="mt-1.5">{user.role.replaceAll('_', ' ')}</Badge>
            </div>
          </div>

          <form
            className="space-y-4"
            onSubmit={profileForm.handleSubmit((data) => updateProfile.mutate(data))}
          >
            <Input
              label="Full name *"
              error={profileForm.formState.errors.fullName?.message}
              {...profileForm.register('fullName')}
            />
            <Input label="Email" value={user.email} disabled />
            <Input
              label="Phone"
              error={profileForm.formState.errors.phone?.message}
              {...profileForm.register('phone')}
            />
            <div className="flex justify-end">
              <Button type="submit" isLoading={updateProfile.isPending}>
                Save profile
              </Button>
            </div>
          </form>
        </section>

        <section className="panel space-y-4 p-4 sm:p-5">
          <h2 className="font-display text-base font-semibold text-ink-950">Change password</h2>
          <form
            className="space-y-4"
            onSubmit={passwordForm.handleSubmit((data) => changePassword.mutate(data))}
          >
            <Input
              label="Current password *"
              type="password"
              autoComplete="current-password"
              error={passwordForm.formState.errors.currentPassword?.message}
              {...passwordForm.register('currentPassword')}
            />
            <Input
              label="New password *"
              type="password"
              autoComplete="new-password"
              error={passwordForm.formState.errors.newPassword?.message}
              {...passwordForm.register('newPassword')}
            />
            <Input
              label="Confirm new password *"
              type="password"
              autoComplete="new-password"
              error={passwordForm.formState.errors.confirmPassword?.message}
              {...passwordForm.register('confirmPassword')}
            />
            <div className="flex justify-end">
              <Button type="submit" variant="outline" isLoading={changePassword.isPending}>
                Update password
              </Button>
            </div>
          </form>
        </section>
      </div>
    </AppLayout>
  );
}
