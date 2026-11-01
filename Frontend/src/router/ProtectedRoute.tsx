import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { PageLoader } from '@/components/ui/spinner';
import { useAppSelector } from '@/store/hooks';
import {
  selectInitialized,
  selectIsAuthenticated,
  selectUser,
} from '@/store/selectors/permissions';

/** Paths a parent may open outside the `/parent` portal. */
const PARENT_ALLOWED_PATHS = ['/parent', '/profile', '/forbidden'];

function isParentAllowedPath(pathname: string) {
  return PARENT_ALLOWED_PATHS.some(
    (allowed) => pathname === allowed || pathname.startsWith(`${allowed}/`),
  );
}

export function ProtectedRoute() {
  const initialized = useAppSelector(selectInitialized);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectUser);
  const location = useLocation();

  if (!initialized) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  // Parents are confined to the parent portal; staff paths redirect home.
  if (user?.role === 'parent' && !isParentAllowedPath(location.pathname)) {
    return <Navigate to="/parent" replace />;
  }
  return <Outlet />;
}
