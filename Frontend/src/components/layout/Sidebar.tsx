import {
  BarChart3,
  BookOpen,
  Building2,
  CalendarCheck,
  CreditCard,
  DollarSign,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LifeBuoy,
  ArrowRightLeft,
  BookMarked,
  CalendarRange,
  Megaphone,
  School,
  ScrollText,
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
  /** Show if user has any of these permissions (overrides single `permission` when set). */
  anyOf?: string[];
  permission?: string;
  exact?: boolean;
}

interface MenuGroup {
  label: string;
  items: MenuItem[];
}

const SUPER_ADMIN_GROUPS: MenuGroup[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, exact: true },
      { label: 'Schools', path: '/schools', icon: Building2 },
      { label: 'Analytics', path: '/analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'Platform',
    items: [
      { label: 'Subscriptions', path: '/subscriptions', icon: CreditCard },
      { label: 'Billing', path: '/billing', icon: DollarSign },
      { label: 'Permissions', path: '/permissions', icon: Shield },
      { label: 'System roles', path: '/system-roles', icon: UserCog },
      { label: 'Support', path: '/support', icon: LifeBuoy },
      { label: 'Settings', path: '/settings', icon: Settings, exact: true },
    ],
  },
];

const SCHOOL_GROUPS: MenuGroup[] = [
  {
    label: 'Overview',
    items: [{ label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, exact: true }],
  },
  {
    label: 'Academic',
    items: [
      { label: 'Students', path: '/students', icon: GraduationCap, permission: 'students.read' },
      {
        label: 'Promote',
        path: '/students/promote',
        icon: ArrowRightLeft,
        anyOf: ['students.promote', 'students.update'],
      },
      { label: 'Teachers', path: '/teachers', icon: Users, permission: 'teachers.read' },
      { label: 'Classes', path: '/settings/classes', icon: School, permission: 'classes.read' },
      { label: 'Subjects', path: '/settings/subjects', icon: BookOpen, permission: 'classes.read' },
      {
        label: 'Session years',
        path: '/session-years',
        icon: CalendarRange,
        anyOf: ['session_years.read', 'session_years.write', 'settings.school.edit'],
      },
      {
        label: 'Attendance',
        path: '/attendance',
        icon: CalendarCheck,
        permission: 'attendance.read',
      },
      { label: 'Exams', path: '/exams', icon: FileText, permission: 'exams.marks.enter' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Fees', path: '/fees', icon: DollarSign, permission: 'fees.invoice.read' },
      {
        label: 'Reports',
        path: '/reports',
        icon: BarChart3,
        anyOf: [
          'reports.fees',
          'reports.attendance',
          'reports.academic',
          'fees.invoice.read',
          'attendance.read',
          'attendance.report',
          'exams.result.publish',
          'exams.reportcard.generate',
        ],
      },
      { label: 'Notices', path: '/notices', icon: Megaphone, permission: 'notices.read' },
      { label: 'Daily diary', path: '/diary', icon: BookMarked, permission: 'diary.read' },
      { label: 'Support', path: '/support', icon: LifeBuoy, permission: 'support.read' },
    ],
  },
  {
    label: 'Administration',
    items: [
      {
        label: 'Custom roles',
        path: '/settings/roles',
        icon: Shield,
        permission: 'settings.roles.manage',
      },
      {
        label: 'Staff',
        path: '/settings/staff',
        icon: UserCog,
        permission: 'settings.users.manage',
      },
      {
        label: 'Audit log',
        path: '/audit',
        icon: ScrollText,
        anyOf: ['audit.read', 'settings.users.manage', 'settings.school.edit'],
      },
      {
        label: 'Settings',
        path: '/settings',
        icon: Settings,
        permission: 'settings.school.edit',
        exact: true,
      },
    ],
  },
];

export function Sidebar() {
  const user = useAppSelector(selectUser);
  const sidebarOpen = useAppSelector((state) => state.ui.sidebarOpen);
  const dispatch = useAppDispatch();
  const { can } = usePermission();
  const isSuperAdmin = user?.role === 'super_admin';
  const groups = isSuperAdmin ? SUPER_ADMIN_GROUPS : SCHOOL_GROUPS;
  const closeSidebar = () => dispatch(setSidebar(false));

  const visibleGroups = groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (item.anyOf?.length) return item.anyOf.some((permission) => can(permission));
        return !item.permission || can(item.permission);
      }),
    }))
    .filter((group) => group.items.length > 0);

  const contents = (
    <>
      <div className="flex items-center justify-between border-b border-ink-100 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-700 text-white shadow-sm">
            <GraduationCap className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-display text-sm font-semibold text-ink-950">SchoolSaaS</h2>
            <p className="text-xs text-ink-500">
              {isSuperAdmin ? 'Admin panel' : 'School workspace'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={closeSidebar}
          className="rounded-lg p-2 text-ink-500 hover:bg-ink-100 lg:hidden"
          aria-label="Close navigation"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav aria-label="Main navigation" className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {visibleGroups.map((group) => (
          <div key={group.label}>
            <p className="mb-1.5 px-3 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-ink-400">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <SidebarItem key={item.path} {...item} onNavigate={closeSidebar} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-ink-100 px-4 py-3 text-xs text-ink-400">v1.0.0</div>
    </>
  );

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-ink-200/80 bg-surface lg:flex">
        {contents}
      </aside>
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <button
            className="absolute inset-0 bg-ink-950/40 backdrop-blur-[2px]"
            onClick={closeSidebar}
            aria-label="Close navigation overlay"
          />
          <aside className="relative flex w-72 max-w-[85vw] flex-col bg-surface shadow-[var(--shadow-lift)]">
            {contents}
          </aside>
        </div>
      )}
    </>
  );
}
