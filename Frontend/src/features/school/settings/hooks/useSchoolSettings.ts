import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';

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
    onSuccess: () => {
      toast.success('School settings saved');
      void queryClient.invalidateQueries({ queryKey: schoolSettingsKeys.all });
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to save settings'),
  });
}
