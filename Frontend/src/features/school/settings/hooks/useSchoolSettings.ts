import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectUser } from '@/store/selectors/permissions';
import { setUser } from '@/store/slices/auth.slice';

export interface SchoolSettings {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  address: string | null;
  logoUrl: string | null;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  plan: string;
  status: string;
  settings: {
    academicYear?: string;
    gradingSystem?: string;
    timezone?: string;
    dateFormat?: string;
    currency?: string;
    cardAttendanceEnabled?: boolean;
  };
  maxStudents: number;
  maxTeachers: number;
  updatedAt: string;
}

export const schoolSettingsKeys = {
  all: ['school-settings'] as const,
};

export function useSchoolSettings() {
  return useQuery({
    queryKey: schoolSettingsKeys.all,
    queryFn: async () => {
      const response = await api.get<SchoolSettings>('/school/settings');
      if (!response.data) throw new Error('The server returned no school settings');
      return response.data;
    },
  });
}

export function useUpdateSchoolSettings() {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);

  return useMutation({
    mutationFn: async (data: Partial<{
      name: string;
      city: string | null;
      address: string | null;
      logoUrl: string | null;
      ownerName: string;
      ownerPhone: string;
      settings: SchoolSettings['settings'];
    }>) => {
      const response = await api.patch<SchoolSettings>('/school/settings', data);
      if (!response.data) throw new Error('Settings were not updated');
      return response.data;
    },
    onSuccess: (updated) => {
      toast.success('School settings saved');
      void queryClient.invalidateQueries({ queryKey: schoolSettingsKeys.all });
      // Apply locale immediately so lists/dates refresh without waiting for /auth/me.
      if (user) {
        dispatch(
          setUser({
            ...user,
            tenantLocale: {
              timezone: updated.settings.timezone || 'Asia/Karachi',
              dateFormat: updated.settings.dateFormat || 'DD/MM/YYYY',
            },
          }),
        );
      }
      void queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to save settings'),
  });
}
