import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, CheckCheck, ScanLine, Users } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { PageLoader } from '@/components/ui/spinner';
import { StatCard } from '@/components/ui/stat-card';
import { useClasses } from '@/features/school/classes/hooks/useClasses';
import { useSections } from '@/features/school/classes/hooks/useSections';
import { usePermission } from '@/hooks/usePermission';
import {
  useAttendanceSheet,
  useSaveAttendanceSheet,
  type AttendanceSheetRecord,
} from '../hooks/useAttendanceSheet';
import type { AttendanceStatus } from '../hooks/keys';

const STATUSES: { value: AttendanceStatus; label: string; className: string }[] = [
  { value: 'present', label: 'Present', className: 'bg-success-100 text-success-700 border-success-100' },
  { value: 'absent', label: 'Absent', className: 'bg-danger-100 text-danger-700 border-danger-100' },
  { value: 'late', label: 'Late', className: 'bg-warning-100 text-warning-700 border-warning-100' },
  { value: 'leave', label: 'Leave', className: 'bg-primary-100 text-primary-800 border-primary-200' },
];

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function AttendancePage() {
  const { can } = usePermission();
  const canMark = can('attendance.mark');
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [date, setDate] = useState(today);
  const [draft, setDraft] = useState<Record<string, AttendanceStatus | null>>({});

  const classesQuery = useClasses();
  const sectionsQuery = useSections(classId);
  const sheetQuery = useAttendanceSheet(sectionId, date);
  const saveSheet = useSaveAttendanceSheet();

  useEffect(() => {
    setSectionId('');
    setDraft({});
  }, [classId]);

  useEffect(() => {
    if (!sheetQuery.data) {
      setDraft({});
      return;
    }
    const next: Record<string, AttendanceStatus | null> = {};
    for (const record of sheetQuery.data.records) {
      next[record.studentId] = record.status;
    }
    setDraft(next);
  }, [sheetQuery.data]);

  const counts = useMemo(() => {
    const values = Object.values(draft);
    return {
      present: values.filter((v) => v === 'present').length,
      absent: values.filter((v) => v === 'absent').length,
      late: values.filter((v) => v === 'late').length,
      leave: values.filter((v) => v === 'leave').length,
      unmarked: values.filter((v) => v === null || v === undefined).length,
    };
  }, [draft]);

  const markAll = (status: AttendanceStatus) => {
    if (!sheetQuery.data) return;
    const next: Record<string, AttendanceStatus | null> = {};
    for (const record of sheetQuery.data.records) {
      next[record.studentId] = status;
    }
    setDraft(next);
  };

  const setOne = (studentId: string, status: AttendanceStatus) => {
    setDraft((current) => ({ ...current, [studentId]: status }));
  };

  const handleSave = () => {
    if (!sheetQuery.data) return;
    const records = sheetQuery.data.records
      .map((record) => {
        const status = draft[record.studentId];
        if (!status) return null;
        return { studentId: record.studentId, status };
      })
      .filter(Boolean) as Array<{ studentId: string; status: AttendanceStatus }>;

    if (records.length === 0) {
      return;
    }

    saveSheet.mutate({ sectionId, date, records });
  };

  const records: AttendanceSheetRecord[] = sheetQuery.data?.records ?? [];
  const unmarkedInDraft = records.some((record) => !draft[record.studentId]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Academic"
          title="Attendance"
          description="Mark daily attendance by class section."
          actions={
            <>
              {canMark && (
                <Link
                  to="/attendance/scan"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-ink-200 bg-white px-4 text-sm font-semibold text-ink-800 hover:bg-ink-50"
                >
                  <ScanLine className="h-4 w-4" aria-hidden="true" /> Scan station
                </Link>
              )}
              {canMark && sectionId && records.length > 0 && (
                <Button onClick={handleSave} isLoading={saveSheet.isPending} disabled={unmarkedInDraft}>
                  <CheckCheck className="h-4 w-4" aria-hidden="true" /> Save attendance
                </Button>
              )}
            </>
          }
        />

        <section className="panel grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 md:grid-cols-12">
          <div className="md:col-span-4">
            <label htmlFor="att-class" className="mb-1.5 block text-sm font-medium text-ink-800">
              Class
            </label>
            <select
              id="att-class"
              className="field-select"
              value={classId}
              onChange={(event) => setClassId(event.target.value)}
            >
              <option value="">Select class</option>
              {classesQuery.data?.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-4">
            <label htmlFor="att-section" className="mb-1.5 block text-sm font-medium text-ink-800">
              Section
            </label>
            <select
              id="att-section"
              className="field-select"
              value={sectionId}
              disabled={!classId || sectionsQuery.isPending}
              onChange={(event) => setSectionId(event.target.value)}
            >
              <option value="">Select section</option>
              {sectionsQuery.data?.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.name}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2 md:col-span-4">
            <Input
              id="att-date"
              label="Date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </div>
        </section>

        {!sectionId ? (
          <EmptyState
            icon={CalendarCheck}
            title="Choose a section"
            description="Select class and section to load the attendance sheet."
          />
        ) : sheetQuery.isPending ? (
          <div className="panel">
            <PageLoader compact />
          </div>
        ) : sheetQuery.error ? (
          <section className="panel border-danger-100 p-8 text-center">
            <h2 className="font-display font-semibold text-ink-950">Failed to load attendance</h2>
            <p className="mt-2 text-sm text-ink-600">{sheetQuery.error.message}</p>
            <Button
              className="mt-4"
              variant="outline"
              onClick={() => void sheetQuery.refetch()}
              isLoading={sheetQuery.isFetching}
            >
              Try again
            </Button>
          </section>
        ) : records.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No active students"
            description="Add students to this section before marking attendance."
          />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <StatCard label="Present" value={counts.present} />
              <StatCard label="Absent" value={counts.absent} />
              <StatCard label="Late" value={counts.late} />
              <StatCard label="Leave" value={counts.leave} />
              <StatCard label="Unmarked" value={counts.unmarked} className="col-span-2 sm:col-span-1" />
            </div>

            {canMark && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-ink-500">Mark all:</span>
                {STATUSES.map((status) => (
                  <Button
                    key={status.value}
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => markAll(status.value)}
                  >
                    {status.label}
                  </Button>
                ))}
              </div>
            )}

            <div className="panel overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="sticky top-0 border-b border-ink-100 bg-ink-50 text-xs uppercase tracking-wide text-ink-500">
                    <tr>
                      <th className="px-4 py-3 font-semibold sm:px-5">Student</th>
                      <th className="hidden px-4 py-3 font-semibold sm:table-cell sm:px-5">
                        Admission
                      </th>
                      <th className="px-4 py-3 font-semibold sm:px-5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    {records.map((record) => {
                      const current = draft[record.studentId] ?? null;
                      return (
                        <tr key={record.studentId} className="hover:bg-ink-50">
                          <td className="px-4 py-3 sm:px-5 sm:py-4">
                            <span className="block font-semibold text-ink-950">{record.fullName}</span>
                            <span className="block text-xs capitalize text-ink-500">
                              {record.gender}
                              <span className="font-mono sm:hidden"> · {record.admissionNo}</span>
                            </span>
                          </td>
                          <td className="hidden px-4 py-4 font-mono text-xs text-ink-800 sm:table-cell sm:px-5">
                            {record.admissionNo}
                          </td>
                          <td className="px-4 py-3 sm:px-5 sm:py-4">
                            {canMark ? (
                              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                {STATUSES.map((status) => (
                                  <button
                                    key={status.value}
                                    type="button"
                                    onClick={() => setOne(record.studentId, status.value)}
                                    aria-pressed={current === status.value}
                                    className={`rounded-full border px-2.5 py-1 text-xs font-medium transition sm:px-3 ${
                                      current === status.value
                                        ? status.className
                                        : 'border-ink-200 bg-white text-ink-600 hover:bg-ink-50'
                                    }`}
                                  >
                                    {status.label}
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <span
                                className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium capitalize ${
                                  STATUSES.find((s) => s.value === current)?.className ??
                                  'border-ink-200 bg-ink-100 text-ink-700'
                                }`}
                              >
                                {current ?? 'Unmarked'}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {canMark && unmarkedInDraft && (
              <p className="text-sm text-warning-700">
                Mark every student before saving. Use “Mark all Present” for a quick start.
              </p>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
