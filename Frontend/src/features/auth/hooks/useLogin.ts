import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { api, tokenStorage } from '@/lib/api';
import { useAppDispatch } from '@/store/hooks';
import { setUser, type User } from '@/store/slices/auth.slice';

interface LoginCredentials {
  email: string;
  password: string;
  tenantSlug?: string;
}

interface LoginResponse {
  accessToken: string;
  user: User;
}

export function useLogin() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await api.post<LoginResponse>('/auth/login', credentials);
      if (!response.data?.accessToken || !response.data.user) {
        throw new Error('The server returned an incomplete login response');
      }
      return response.data;
    },
    onSuccess: ({ accessToken, user }) => {
      tokenStorage.set(accessToken);
      dispatch(setUser(user));
      toast.success('Welcome back!');
      navigate('/dashboard', { replace: true });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Login failed');
    },
  });
}
