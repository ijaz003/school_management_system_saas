import { and, eq, gte, isNull, lte, sql } from 'drizzle-orm';
import { db } from '../../config/database.js';
import { users } from '../auth/auth.schema.js';
import { attendanceRecords } from '../attendance/attendance.schema.js';
import { feeInvoices, feePayments } from '../fees/fees.schema.js';
import { notices } from '../notices/notices.schema.js';
import { students } from '../students/students.schema.js';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function startOfMonthIso() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    .toISOString()
    .slice(0, 10);
}

export async function getDashboardStats(tenantId: string) {
  const today = todayIso();
  const monthStart = startOfMonthIso();

  const [
    studentRows,
    teacherRows,
    attendanceRows,
    feeStatusRows,
    collectedRows,
    noticeRows,
    recentNotices,
  ] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(students)
      .where(
        and(
          eq(students.tenantId, tenantId),
          eq(students.status, 'active'),
          isNull(students.deletedAt),
        ),
      ),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(
        and(
          eq(users.tenantId, tenantId),
          eq(users.role, 'teacher'),
          eq(users.isActive, true),
          isNull(users.deletedAt),
        ),
      ),
    db
      .select({
        present: sql<number>`count(*) filter (where ${attendanceRecords.status} = 'present')::int`,
        absent: sql<number>`count(*) filter (where ${attendanceRecords.status} = 'absent')::int`,
        late: sql<number>`count(*) filter (where ${attendanceRecords.status} = 'late')::int`,
        leave: sql<number>`count(*) filter (where ${attendanceRecords.status} = 'leave')::int`,
        total: sql<number>`count(*)::int`,
      })
      .from(attendanceRecords)
      .where(
        and(eq(attendanceRecords.tenantId, tenantId), eq(attendanceRecords.date, today)),
      ),
    db
      .select({
        openInvoices: sql<number>`count(*) filter (where ${feeInvoices.status} in ('issued', 'partial'))::int`,
        paidInvoices: sql<number>`count(*) filter (where ${feeInvoices.status} = 'paid')::int`,
        outstandingBalance: sql<number>`coalesce(sum(case when ${feeInvoices.status} in ('issued', 'partial') then (${feeInvoices.amount} - ${feeInvoices.amountPaid}) else 0 end), 0)::int`,
      })
      .from(feeInvoices)
      .where(and(eq(feeInvoices.tenantId, tenantId), isNull(feeInvoices.deletedAt))),
    db
      .select({
        collectedThisMonth: sql<number>`coalesce(sum(${feePayments.amount}), 0)::int`,
      })
      .from(feePayments)
      .where(
        and(
          eq(feePayments.tenantId, tenantId),
          isNull(feePayments.deletedAt),
          gte(feePayments.paidAt, new Date(`${monthStart}T00:00:00.000Z`)),
        ),
      ),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(notices)
      .where(
        and(
          eq(notices.tenantId, tenantId),
          eq(notices.status, 'published'),
          isNull(notices.deletedAt),
        ),
      ),
    db
      .select({
        id: notices.id,
        title: notices.title,
        body: notices.body,
        publishedAt: notices.publishedAt,
        audience: notices.audience,
      })
      .from(notices)
      .where(
        and(
          eq(notices.tenantId, tenantId),
          eq(notices.status, 'published'),
          isNull(notices.deletedAt),
        ),
      )
      .orderBy(sql`${notices.publishedAt} desc nulls last`)
      .limit(5),
  ]);

  const attendance = attendanceRows[0];
  const fees = feeStatusRows[0];

  return {
    date: today,
    students: {
      active: Number(studentRows[0]?.count ?? 0),
    },
    teachers: {
      active: Number(teacherRows[0]?.count ?? 0),
    },
    attendanceToday: {
      present: Number(attendance?.present ?? 0),
      absent: Number(attendance?.absent ?? 0),
      late: Number(attendance?.late ?? 0),
      leave: Number(attendance?.leave ?? 0),
      marked: Number(attendance?.total ?? 0),
    },
    fees: {
      openInvoices: Number(fees?.openInvoices ?? 0),
      paidInvoices: Number(fees?.paidInvoices ?? 0),
      outstandingBalance: Number(fees?.outstandingBalance ?? 0),
      collectedThisMonth: Number(collectedRows[0]?.collectedThisMonth ?? 0),
    },
    notices: {
      published: Number(noticeRows[0]?.count ?? 0),
      recent: recentNotices,
    },
  };
}
