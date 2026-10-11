import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { User } from '@/store/slices/auth.slice';

export function useMe() {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const response = await api.get<User>('/auth/me');
      if (!response.data) throw new Error('The server returned no user data');
      return response.data;
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}
