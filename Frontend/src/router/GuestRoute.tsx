import { Navigate, Outlet } from 'react-router-dom';
import { PageLoader } from '@/components/ui/spinner';
import { useAppSelector } from '@/store/hooks';
import { selectInitialized, selectIsAuthenticated } from '@/store/selectors/permissions';

export function GuestRoute() {
  const initialized = useAppSelector(selectInitialized);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  if (!initialized) return <PageLoader />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
