import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { PageLoader } from '@/components/ui/spinner';
import { useAppSelector } from '@/store/hooks';
import { selectInitialized, selectIsAuthenticated } from '@/store/selectors/permissions';

export function ProtectedRoute() {
  const initialized = useAppSelector(selectInitialized);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const location = useLocation();

  if (!initialized) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  return <Outlet />;
}
