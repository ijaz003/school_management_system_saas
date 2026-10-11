import { Bell, Menu } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectUser } from '@/store/selectors/permissions';
import { toggleSidebar } from '@/store/slices/ui.slice';
import { UserMenu } from './UserMenu';

export function Topbar() {
  const user = useAppSelector(selectUser);
  const dispatch = useAppDispatch();

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => dispatch(toggleSidebar())} className="rounded-lg p-2 hover:bg-gray-100 lg:hidden" aria-label="Open navigation">
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="hidden text-sm font-medium text-gray-500 lg:block">
            {user?.role === 'super_admin' ? 'Super Admin Panel' : 'School Management'}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" className="relative rounded-lg p-2 transition-colors hover:bg-gray-100" aria-label="Notifications">
            <Bell className="h-5 w-5 text-gray-600" />
          </button>
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
