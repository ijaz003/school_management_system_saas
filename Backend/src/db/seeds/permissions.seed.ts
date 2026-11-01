import { db } from '../../config/database.js';
import { permissions } from '../../modules/roles/roles.schema.js';

export const PERMISSIONS_LIST = [
  { key: 'students.create', displayName: 'Add Student', module: 'students', action: 'create', category: 'Academic' },
  { key: 'students.read', displayName: 'View Students', module: 'students', action: 'read', category: 'Academic' },
  { key: 'students.update', displayName: 'Edit Student', module: 'students', action: 'update', category: 'Academic' },
  { key: 'students.delete', displayName: 'Delete Student', module: 'students', action: 'delete', category: 'Academic' },
  { key: 'students.promote', displayName: 'Promote Students', module: 'students', action: 'update', category: 'Academic' },
  { key: 'session_years.read', displayName: 'View Session Years', module: 'session_years', action: 'read', category: 'Academic' },
  { key: 'session_years.write', displayName: 'Manage Session Years', module: 'session_years', action: 'update', category: 'Academic' },
  { key: 'teachers.create', displayName: 'Add Teacher', module: 'teachers', action: 'create', category: 'Academic' },
  { key: 'teachers.read', displayName: 'View Teachers', module: 'teachers', action: 'read', category: 'Academic' },
  { key: 'teachers.update', displayName: 'Edit Teacher', module: 'teachers', action: 'update', category: 'Academic' },
  { key: 'teachers.delete', displayName: 'Delete Teacher', module: 'teachers', action: 'delete', category: 'Academic' },
  { key: 'classes.create', displayName: 'Create Class', module: 'classes', action: 'create', category: 'Academic' },
  { key: 'classes.read', displayName: 'View Classes', module: 'classes', action: 'read', category: 'Academic' },
  { key: 'classes.update', displayName: 'Edit Class', module: 'classes', action: 'update', category: 'Academic' },
  { key: 'classes.delete', displayName: 'Delete Class', module: 'classes', action: 'delete', category: 'Academic' },
  { key: 'attendance.mark', displayName: 'Mark Attendance', module: 'attendance', action: 'create', category: 'Academic' },
  { key: 'attendance.read', displayName: 'View Attendance', module: 'attendance', action: 'read', category: 'Academic' },
  { key: 'attendance.report', displayName: 'Attendance Reports', module: 'attendance', action: 'read', category: 'Academic' },
  { key: 'fees.invoice.create', displayName: 'Create Invoice', module: 'fees', action: 'create', category: 'Finance' },
  { key: 'fees.invoice.read', displayName: 'View Invoices', module: 'fees', action: 'read', category: 'Finance' },
  { key: 'fees.payment.record', displayName: 'Record Payment', module: 'fees', action: 'create', category: 'Finance' },
  { key: 'fees.payment.refund', displayName: 'Refund Payment', module: 'fees', action: 'update', category: 'Finance' },
  { key: 'fees.structure.edit', displayName: 'Edit Fee Structure', module: 'fees', action: 'update', category: 'Finance' },
  { key: 'expenses.read', displayName: 'View Expenses', module: 'expenses', action: 'read', category: 'Finance' },
  { key: 'expenses.create', displayName: 'Record Expenses', module: 'expenses', action: 'create', category: 'Finance' },
  { key: 'expenses.update', displayName: 'Edit Expenses', module: 'expenses', action: 'update', category: 'Finance' },
  { key: 'expenses.delete', displayName: 'Delete Expenses', module: 'expenses', action: 'delete', category: 'Finance' },
  { key: 'expenses.categories.manage', displayName: 'Manage Expense Categories', module: 'expenses', action: 'update', category: 'Finance' },
  { key: 'reports.expenses', displayName: 'Expense Reports', module: 'reports', action: 'read', category: 'Reports' },
  { key: 'timetable.read', displayName: 'View Timetable', module: 'timetable', action: 'read', category: 'Academic' },
  { key: 'timetable.write', displayName: 'Manage Timetable', module: 'timetable', action: 'update', category: 'Academic' },
  { key: 'exams.schedule.create', displayName: 'Create Exam Schedule', module: 'exams', action: 'create', category: 'Academic' },
  { key: 'exams.marks.enter', displayName: 'Enter Marks', module: 'exams', action: 'create', category: 'Academic' },
  { key: 'exams.marks.approve', displayName: 'Approve Marks', module: 'exams', action: 'update', category: 'Academic' },
  { key: 'exams.result.publish', displayName: 'Publish Results', module: 'exams', action: 'update', category: 'Academic' },
  { key: 'exams.reportcard.generate', displayName: 'Generate Report Cards', module: 'exams', action: 'read', category: 'Academic' },
  { key: 'notices.send', displayName: 'Send Notices', module: 'notices', action: 'create', category: 'Communication' },
  { key: 'notices.read', displayName: 'View Notices', module: 'notices', action: 'read', category: 'Communication' },
  { key: 'diary.read', displayName: 'View Daily Diary', module: 'diary', action: 'read', category: 'Communication' },
  { key: 'diary.write', displayName: 'Manage Daily Diary', module: 'diary', action: 'create', category: 'Communication' },
  { key: 'sms.send', displayName: 'Send SMS', module: 'notices', action: 'create', category: 'Communication' },
  { key: 'reports.fees', displayName: 'Fee Reports', module: 'reports', action: 'read', category: 'Reports' },
  { key: 'reports.academic', displayName: 'Academic Reports', module: 'reports', action: 'read', category: 'Reports' },
  { key: 'reports.attendance', displayName: 'Attendance Reports', module: 'reports', action: 'read', category: 'Reports' },
  { key: 'support.read', displayName: 'View Support Tickets', module: 'support', action: 'read', category: 'Support' },
  { key: 'support.create', displayName: 'Create Support Tickets', module: 'support', action: 'create', category: 'Support' },
  { key: 'audit.read', displayName: 'View Audit Log', module: 'audit', action: 'read', category: 'Settings' },
  { key: 'settings.school.edit', displayName: 'Edit School Settings', module: 'settings', action: 'update', category: 'Settings' },
  { key: 'settings.users.manage', displayName: 'Manage Users', module: 'settings', action: 'update', category: 'Settings' },
  { key: 'settings.roles.manage', displayName: 'Manage Roles', module: 'settings', action: 'update', category: 'Settings' },
  { key: 'settings.feeheads.edit', displayName: 'Edit Fee Heads', module: 'settings', action: 'update', category: 'Settings' },
  { key: 'subscription.view', displayName: 'View Subscription', module: 'subscription', action: 'read', category: 'Billing' },
  { key: 'subscription.manage', displayName: 'Manage Subscription', module: 'subscription', action: 'update', category: 'Billing' },
] as const;

export async function seedPermissions() {
  const rows = PERMISSIONS_LIST.map((permission) => ({
    ...permission,
    isActive: true,
    isAssignableToSchools: true,
  }));

  const inserted = await db
    .insert(permissions)
    .values(rows)
    .onConflictDoNothing({ target: permissions.key })
    .returning({ id: permissions.id });

  console.log(
    `Permissions seeded: ${inserted.length} added, ${rows.length - inserted.length} already present`,
  );
}
