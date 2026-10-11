import {
  BarChart3,
  Building2,
  CalendarCheck,
  CreditCard,
  DollarSign,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LifeBuoy,
  Megaphone,
  School,
  Settings,
  Shield,
  UserCog,
  Users,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectUser } from '@/store/selectors/permissions';
import { setSidebar } from '@/store/slices/ui.slice';
import { usePermission } from '@/hooks/usePermission';
import { SidebarItem } from './SidebarItem';

interface MenuItem {
  label: string;
  path: string;
  icon: LucideIcon;
  permission?: string;
}

const SUPER_ADMIN_MENU: MenuItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Schools', path: '/schools', icon: Building2 },
  { label: 'Subscriptions', path: '/subscriptions', icon: CreditCard },
  { label: 'Billing', path: '/billing', icon: DollarSign },
  { label: 'Permissions', path: '/permissions', icon: Shield },
  { label: 'System roles', path: '/system-roles', icon: UserCog },
  { label: 'Analytics', path: '/analytics', icon: BarChart3 },
  { label: 'Support', path: '/support', icon: LifeBuoy },
  { label: 'Settings', path: '/settings', icon: Settings },
];

const SCHOOL_MENU: MenuItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Students', path: '/students', icon: GraduationCap, permission: 'students.read' },
  { label: 'Teachers', path: '/teachers', icon: Users, permission: 'teachers.read' },
  { label: 'Classes', path: '/classes', icon: School, permission: 'classes.read' },
  { label: 'Fees', path: '/fees', icon: DollarSign, permission: 'fees.invoice.read' },
  { label: 'Exams', path: '/exams', icon: FileText, permission: 'exams.marks.enter' },
  { label: 'Attendance', path: '/attendance', icon: CalendarCheck, permission: 'attendance.read' },
  { label: 'Notices', path: '/notices', icon: Megaphone, permission: 'notices.read' },
  { label: 'Custom roles', path: '/settings/roles', icon: Shield, permission: 'settings.roles.manage' },
  { label: 'Staff', path: '/settings/staff', icon: UserCog, permission: 'settings.users.manage' },
  { label: 'Settings', path: '/settings', icon: Settings, permission: 'settings.school.edit' },
];

export function Sidebar() {
  const user = useAppSelector(selectUser);
  const sidebarOpen = useAppSelector((state) => state.ui.sidebarOpen);
  const dispatch = useAppDispatch();
  const { can } = usePermission();
  const isSuperAdmin = user?.role === 'super_admin';
  const menuItems = isSuperAdmin ? SUPER_ADMIN_MENU : SCHOOL_MENU;
  const visibleItems = menuItems.filter(
    (item) => !item.permission || can(item.permission),
  );
  const closeSidebar = () => dispatch(setSidebar(false));

  const contents = (
    <>
      <div className="flex items-center justify-between border-b border-gray-200 p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
            <GraduationCap className="h-5 w-5 text-white" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">SchoolSaaS</h2>
            <p className="text-xs text-gray-500">{isSuperAdmin ? 'Admin panel' : 'Management'}</p>
          </div>
        </div>
        <button type="button" onClick={closeSidebar} className="rounded p-2 hover:bg-gray-100 lg:hidden" aria-label="Close navigation">
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav aria-label="Main navigation" className="flex-1 space-y-1 overflow-y-auto p-3">
        {visibleItems.map((item) => (
          <SidebarItem key={item.path} {...item} onNavigate={closeSidebar} />
        ))}
      </nav>
      <div className="border-t border-gray-200 p-3 text-center text-xs text-gray-400">v1.0.0</div>
    </>
  );

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-gray-200 bg-white lg:flex">
        {contents}
      </aside>
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <button className="absolute inset-0 bg-black/40" onClick={closeSidebar} aria-label="Close navigation overlay" />
          <aside className="relative flex w-72 max-w-[85vw] flex-col bg-white shadow-xl">
            {contents}
          </aside>
        </div>
      )}
    </>
  );
}
