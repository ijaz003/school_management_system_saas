// src/App.tsx
import { useEffect } from 'react';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api';
import { PageLoader } from '@/components/ui/spinner';
import { useMe } from '@/features/auth/hooks/useMe';
import { AppRouter } from '@/router';
import { useAppDispatch } from '@/store/hooks';
import { setInitialized, setUser } from '@/store/slices/auth.slice';

export default function App() {
  const dispatch = useAppDispatch();
  const { data, error, isPending } = useMe();

  useEffect(() => {
    if (data) {
      dispatch(setUser(data));
    } else if (!isPending) {
      dispatch(setInitialized());
    }
    if (error && (!(error instanceof ApiError) || error.status !== 401)) {
      toast.error(error instanceof Error ? error.message : 'Could not verify the current session');
    }
  }, [data, dispatch, error, isPending]);

  if (isPending) return <PageLoader />;
  return <AppRouter />;
}