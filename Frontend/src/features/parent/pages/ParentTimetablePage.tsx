import { useMemo } from 'react';
import { CalendarClock } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { PageLoader } from '@/components/ui/spinner';
import { ChildPageShell, QueryError } from '../components/ChildPageShell';
import {
  useChildTimetable,
  type ChildTimetableEntry,
} from '../hooks/useParentPortal';

const DAYS: { value: number; label: string; short: string }[] = [
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
];

export function ParentTimetablePage() {
  const { studentId = '' } = useParams();
  const timetableQuery = useChildTimetable(studentId);
  const periods = timetableQuery.data?.periods ?? [];
  const entries = timetableQuery.data?.entries ?? [];

  const entryMap = useMemo(() => {
    const map = new Map<string, ChildTimetableEntry>();
    for (const entry of entries) {
      map.set(`${entry.dayOfWeek}:${entry.periodId}`, entry);
    }
    return map;
  }, [entries]);

  const hasAssignments = entries.some((entry) => entry.subjectId || entry.teacherId);

  return (
    <ChildPageShell
      studentId={studentId}
      section="timetable"
      title="Timetable"
      description="Weekly class schedule for your child's section."
    >
      {timetableQuery.isPending ? (
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-ink-100">
          <PageLoader compact />
        </div>
      ) : timetableQuery.error ? (
        <QueryError
          title="Failed to load timetable"
          message={timetableQuery.error.message}
          onRetry={() => void timetableQuery.refetch()}
          retrying={timetableQuery.isFetching}
        />
      ) : periods.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="No timetable yet"
          description="The school has not published a weekly schedule for this class."
        />
      ) : !hasAssignments ? (
        <EmptyState
          icon={CalendarClock}
          title="Schedule not filled"
          description="Periods exist, but subjects have not been assigned yet."
        />
      ) : (
        <section className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-ink-100">
          <table className="min-w-[720px] w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-ink-100 bg-ink-50/80">
                <th className="px-3 py-3 text-left font-medium text-ink-600">Period</th>
                {DAYS.map((day) => (
                  <th key={day.value} className="px-3 py-3 text-left font-medium text-ink-600">
                    <span className="hidden sm:inline">{day.label}</span>
                    <span className="sm:hidden">{day.short}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {periods.map((period) => (
                <tr key={period.id} className="border-b border-ink-100 align-top">
                  <td className="px-3 py-3">
                    <p className="font-medium text-ink-900">{period.name}</p>
                    <p className="text-xs text-ink-500">
                      {period.startTime}–{period.endTime}
                    </p>
                    {period.isBreak ? <Badge tone="warning">Break</Badge> : null}
                  </td>
                  {DAYS.map((day) => {
                    const entry = entryMap.get(`${day.value}:${period.id}`);
                    if (period.isBreak) {
                      return (
                        <td
                          key={day.value}
                          className="bg-ink-50/50 px-3 py-3 text-xs text-ink-400"
                        >
                          —
                        </td>
                      );
                    }
                    return (
                      <td key={day.value} className="px-2 py-2">
                        <div
                          className={`rounded-lg border px-2 py-2 ${
                            entry
                              ? 'border-primary-100 bg-primary-50/40'
                              : 'border-dashed border-ink-200'
                          }`}
                        >
                          {entry ? (
                            <>
                              <p className="font-medium text-ink-900">
                                {entry.subjectName ?? 'Untitled'}
                              </p>
                              {entry.teacherName ? (
                                <p className="mt-0.5 text-xs text-ink-500">{entry.teacherName}</p>
                              ) : null}
                              {entry.room ? (
                                <p className="mt-0.5 text-xs text-ink-400">Room {entry.room}</p>
                              ) : null}
                            </>
                          ) : (
                            <p className="text-xs text-ink-400">—</p>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </ChildPageShell>
  );
}
