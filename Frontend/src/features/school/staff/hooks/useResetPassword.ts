import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';

export interface ResetPasswordResponse {
  tempPassword: string;
  email: string;
  emailSent: boolean;
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async (staffId: string) => {
      const response = await api.post<ResetPasswordResponse>(
        `/school/staff/${staffId}/reset-password`,
      );
      if (!response.data?.tempPassword) {
        throw new Error('The server returned no temporary password');
      }
      return response.data;
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to reset password'),
  });
}
