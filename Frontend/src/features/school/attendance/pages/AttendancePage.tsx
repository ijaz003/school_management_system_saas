import { useEffect, useMemo, useState } from 'react';
import { CalendarCheck, CheckCheck } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageLoader } from '@/components/ui/spinner';
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
  { value: 'present', label: 'Present', className: 'bg-green-100 text-green-800 border-green-200' },
  { value: 'absent', label: 'Absent', className: 'bg-red-100 text-red-800 border-red-200' },
  { value: 'late', label: 'Late', className: 'bg-amber-100 text-amber-800 border-amber-200' },
  { value: 'leave', label: 'Leave', className: 'bg-primary-100 text-primary-800 border-primary-200' },
];

const selectClass =
  'w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500';

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
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600">
              Academic
            </p>
            <h1 className="page-title mt-1 text-2xl">Attendance</h1>
            <p className="page-subtitle">Mark daily attendance by class section.</p>
          </div>
          {canMark && sectionId && records.length > 0 && (
            <Button onClick={handleSave} isLoading={saveSheet.isPending} disabled={unmarkedInDraft}>
              <CheckCheck className="h-4 w-4" aria-hidden="true" /> Save attendance
            </Button>
          )}
        </header>

        <section className="panel grid gap-3 p-4 md:grid-cols-12">
          <div className="md:col-span-4">
            <label htmlFor="att-class" className="mb-1.5 block text-sm font-medium text-ink-800">
              Class
            </label>
            <select
              id="att-class"
              className={selectClass}
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
              className={selectClass}
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
          <div className="md:col-span-4">
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
          <section className="rounded-2xl border border-dashed border-ink-200 bg-white px-6 py-14 text-center">
            <CalendarCheck className="mx-auto h-10 w-10 text-ink-200" aria-hidden="true" />
            <h2 className="mt-3 font-semibold text-ink-950">Choose a section</h2>
            <p className="mt-1 text-sm text-ink-700/70">
              Select class and section to load the attendance sheet.
            </p>
          </section>
        ) : sheetQuery.isPending ? (
          <div className="panel p-12">
            <PageLoader />
          </div>
        ) : sheetQuery.error ? (
          <section className="rounded-2xl border border-red-200 bg-white p-8 text-center">
            <h2 className="font-semibold text-ink-950">Failed to load attendance</h2>
            <p className="mt-2 text-sm text-ink-700">{sheetQuery.error.message}</p>
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
          <section className="rounded-2xl border border-dashed border-ink-200 bg-white px-6 py-14 text-center">
            <h2 className="font-semibold text-ink-950">No active students</h2>
            <p className="mt-1 text-sm text-ink-700/70">
              Add students to this section before marking attendance.
            </p>
          </section>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <Stat label="Present" value={counts.present} />
              <Stat label="Absent" value={counts.absent} />
              <Stat label="Late" value={counts.late} />
              <Stat label="Leave" value={counts.leave} />
              <Stat label="Unmarked" value={counts.unmarked} />
            </div>

            {canMark && (
              <div className="flex flex-wrap gap-2">
                <span className="self-center text-sm text-ink-700/70">Mark all:</span>
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
                  <thead className="border-b border-ink-100 bg-surface/80 text-xs uppercase tracking-wide text-ink-700/70">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Student</th>
                      <th className="px-5 py-3 font-semibold">Admission</th>
                      <th className="px-5 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    {records.map((record) => {
                      const current = draft[record.studentId] ?? null;
                      return (
                        <tr key={record.studentId} className="hover:bg-surface/60">
                          <td className="px-5 py-4">
                            <span className="block font-semibold text-ink-950">{record.fullName}</span>
                            <span className="block text-xs capitalize text-ink-700/65">
                              {record.gender}
                            </span>
                          </td>
                          <td className="px-5 py-4 font-mono text-xs text-ink-800">
                            {record.admissionNo}
                          </td>
                          <td className="px-5 py-4">
                            {canMark ? (
                              <div className="flex flex-wrap gap-2">
                                {STATUSES.map((status) => (
                                  <button
                                    key={status.value}
                                    type="button"
                                    onClick={() => setOne(record.studentId, status.value)}
                                    className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                                      current === status.value
                                        ? status.className
                                        : 'border-ink-100 bg-white text-ink-700 hover:bg-surface'
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
                                  'border-ink-100 bg-ink-100 text-ink-700'
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
              <p className="text-sm text-amber-700">
                Mark every student before saving. Use “Mark all Present” for a quick start.
              </p>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <section className="panel p-4">
      <p className="text-xs text-ink-700/70">{label}</p>
      <p className="mt-1 font-display text-xl font-semibold text-ink-950">{value}</p>
    </section>
  );
}
