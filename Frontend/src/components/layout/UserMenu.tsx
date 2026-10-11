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
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
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
  const initials = user.fullName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button type="button" onClick={() => setIsOpen((open) => !open)} aria-expanded={isOpen} className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-gray-100">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">{initials}</span>
        <span className="hidden text-left md:block">
          <span className="block text-xs font-medium text-gray-900">{user.fullName}</span>
          <span className="block text-xs capitalize text-gray-500">{user.role.replaceAll('_', ' ')}</span>
        </span>
        <ChevronDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
      </button>
      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          <div className="border-b border-gray-100 px-3 py-2">
            <div className="truncate text-sm font-medium text-gray-900">{user.fullName}</div>
            <div className="truncate text-xs text-gray-500">{user.email}</div>
          </div>
          <button type="button" onClick={() => { setIsOpen(false); navigate('/profile'); }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
            <UserIcon className="h-4 w-4" /> My profile
          </button>
          <button type="button" onClick={() => { setIsOpen(false); navigate('/settings'); }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
            <Settings className="h-4 w-4" /> Settings
          </button>
          <div className="my-1 border-t border-gray-100" />
          <button type="button" onClick={handleLogout} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50">
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      )}
    </div>
  );
}
