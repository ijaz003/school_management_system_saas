import type { LucideIcon } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface SidebarItemProps {
  label: string;
  path: string;
  icon: LucideIcon;
  onNavigate?: () => void;
  exact?: boolean;
}

export function SidebarItem({
  label,
  path,
  icon: Icon,
  onNavigate,
  exact = false,
}: SidebarItemProps) {
  const location = useLocation();
  const isActive = exact
    ? location.pathname === path
    : location.pathname === path || location.pathname.startsWith(`${path}/`);

  return (
    <Link
      to={path}
      onClick={onNavigate}
      aria-current={isActive ? 'page' : undefined}
      title={label}
      className={cn('nav-link', isActive && 'nav-link-active')}
    >
      <Icon className="h-4 w-4 shrink-0 opacity-80" aria-hidden="true" strokeWidth={1.75} />
      <span className="truncate">{label}</span>
    </Link>
  );
}
