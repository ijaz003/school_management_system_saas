import { Bell, Menu, Search } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectUser } from '@/store/selectors/permissions';
import { toggleSidebar } from '@/store/slices/ui.slice';
import { UserMenu } from './UserMenu';

const ROUTE_TITLES: Array<{ match: RegExp; title: string }> = [
  { match: /^\/dashboard$/, title: 'Dashboard' },
  { match: /^\/students/, title: 'Students' },
  { match: /^\/teachers/, title: 'Teachers' },
  { match: /^\/fees/, title: 'Fees' },
  { match: /^\/exams/, title: 'Exams' },
  { match: /^\/attendance/, title: 'Attendance' },
  { match: /^\/notices/, title: 'Notices' },
  { match: /^\/settings\/classes/, title: 'Classes' },
  { match: /^\/settings\/subjects/, title: 'Subjects' },
  { match: /^\/settings\/staff/, title: 'Staff' },
  { match: /^\/settings\/roles/, title: 'Roles' },
  { match: /^\/settings$/, title: 'Settings' },
  { match: /^\/profile$/, title: 'Profile' },
  { match: /^\/schools/, title: 'Schools' },
];

export function Topbar() {
  const user = useAppSelector(selectUser);
  const dispatch = useAppDispatch();
  const location = useLocation();
  const routeTitle =
    ROUTE_TITLES.find((item) => item.match.test(location.pathname))?.title ??
    (user?.role === 'super_admin' ? 'Admin' : 'Workspace');

  return (
    <header className="sticky top-0 z-30 border-b border-ink-200/80 bg-surface/90 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => dispatch(toggleSidebar())}
            className="rounded-xl p-2 text-ink-600 hover:bg-ink-100 lg:hidden"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink-950">{routeTitle}</p>
            <p className="hidden truncate text-xs text-ink-500 sm:block">
              {user?.role === 'super_admin' ? 'Platform control' : 'School operations'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            className="hidden items-center gap-2 rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm text-ink-400 transition hover:border-ink-300 hover:text-ink-600 md:inline-flex"
            aria-label="Search"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            <span>Search…</span>
            <kbd className="ml-6 rounded-md bg-ink-50 px-1.5 py-0.5 text-[10px] font-semibold text-ink-400">
              ⌘K
            </kbd>
          </button>
          <button
            type="button"
            className="relative rounded-xl p-2 text-ink-600 transition hover:bg-ink-100"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
          </button>
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
