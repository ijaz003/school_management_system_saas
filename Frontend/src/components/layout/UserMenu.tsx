import { useEffect, useRef, useState } from 'react';
import { ChevronDown, LogOut, Settings, User as UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { queryClient } from '@/config/query-client';
import { api, tokenStorage } from '@/lib/api';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectUser } from '@/store/selectors/permissions';
import { logout } from '@/store/slices/auth.slice';

export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const user = useAppSelector(selectUser);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false);
    }
    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout', undefined, { skipRefresh: true });
      toast.success('Logged out');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not end the server session');
    } finally {
      tokenStorage.remove();
      dispatch(logout());
      queryClient.clear();
      navigate('/login', { replace: true });
    }
  };

  if (!user) return null;
  const initials = user.fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-xl p-1.5 transition hover:bg-ink-100"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-700 text-xs font-semibold text-white">
          {initials}
        </span>
        <span className="hidden text-left md:block">
          <span className="block text-xs font-semibold text-ink-950">{user.fullName}</span>
          <span className="block text-[11px] capitalize text-ink-500">
            {user.role.replaceAll('_', ' ')}
          </span>
        </span>
        <ChevronDown className="hidden h-4 w-4 text-ink-400 md:block" aria-hidden="true" />
      </button>
      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-60 origin-top-right rounded-2xl border border-ink-200 bg-surface py-1 shadow-[var(--shadow-lift)]"
        >
          <div className="border-b border-ink-100 px-3 py-2.5">
            <div className="truncate text-sm font-semibold text-ink-950">{user.fullName}</div>
            <div className="truncate text-xs text-ink-500">{user.email}</div>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setIsOpen(false);
              navigate('/profile');
            }}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-ink-700 hover:bg-ink-50"
          >
            <UserIcon className="h-4 w-4" /> My profile
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setIsOpen(false);
              navigate('/settings');
            }}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-ink-700 hover:bg-ink-50"
          >
            <Settings className="h-4 w-4" /> Settings
          </button>
          <div className="my-1 border-t border-ink-100" />
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-danger-600 hover:bg-danger-50"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      )}
    </div>
  );
}
