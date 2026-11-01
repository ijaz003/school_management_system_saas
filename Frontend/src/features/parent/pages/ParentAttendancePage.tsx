import { useState } from 'react';
import { CalendarCheck, CalendarX, Clock, ShieldCheck } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { Badge, type BadgeTone } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { FilterField, FiltersPanel } from '@/components/ui/filters-panel';
import { Input } from '@/components/ui/input';
import { MetricCard, MetricGrid } from '@/components/ui/metric-card';
import { TableSkeleton } from '@/components/ui/skeleton';
import { ChildPageShell, QueryError } from '../components/ChildPageShell';
import { useChildAttendance, type AttendanceStatus } from '../hooks/useParentPortal';

const STATUS_TONE: Record<AttendanceStatus, BadgeTone> = {
  present: 'success',
  absent: 'danger',
  late: 'warning',
  excused: 'primary',
};

export function ParentAttendancePage() {
  const { studentId = '' } = useParams();
  const [range, setRange] = useState<{ from?: string; to?: string }>({});
  const rangeError =
    range.from && range.to && range.from > range.to ? '“From” must be on or before “To”.' : '';
  const attendanceQuery = useChildAttendance(studentId, rangeError ? {} : range);
  const data = attendanceQuery.data;

  return (
    <ChildPageShell
      studentId={studentId}
      section="attendance"
      title="Attendance"
      description="Daily attendance records. Defaults to the last 30 days."
    >
      <FiltersPanel
        description="Choose a date range."
        onClear={() => setRange({})}
        clearDisabled={!range.from && !range.to}
      >
        <FilterField id="att-from" label="From" className="md:col-span-3">
          <Input
            id="att-from"
            type="date"
            value={range.from ?? ''}
            max={range.to}
            onChange={(event) =>
              setRange((current) => ({ ...current, from: event.target.value || undefined }))
            }
          />
        </FilterField>
        <FilterField id="att-to" label="To" className="md:col-span-3">
          <Input
            id="att-to"
            type="date"
            value={range.to ?? ''}
            min={range.from}
            onChange={(event) =>
              setRange((current) => ({ ...current, to: event.target.value || undefined }))
            }
          />
        </FilterField>
        {rangeError && (
          <p role="alert" className="text-sm text-danger-600 md:col-span-12">
            {rangeError}
          </p>
        )}
      </FiltersPanel>

      {attendanceQuery.isPending ? (
        <TableSkeleton rows={6} />
      ) : attendanceQuery.error ? (
        <QueryError
          title="Failed to load attendance"
          message={attendanceQuery.error.message}
          onRetry={() => void attendanceQuery.refetch()}
          retrying={attendanceQuery.isFetching}
        />
      ) : data ? (
        <>
          <p className="text-xs text-ink-500">
            Showing {new Date(`${data.from}T00:00:00`).toLocaleDateString()} –{' '}
            {new Date(`${data.to}T00:00:00`).toLocaleDateString()}
          </p>
          <MetricGrid>
            <MetricCard
              icon={<CalendarCheck className="h-4 w-4" aria-hidden="true" />}
              label="Present"
              value={data.summary.present}
              tone="success"
            />
            <MetricCard
              icon={<CalendarX className="h-4 w-4" aria-hidden="true" />}
              label="Absent"
              value={data.summary.absent}
              tone="danger"
            />
            <MetricCard
              icon={<Clock className="h-4 w-4" aria-hidden="true" />}
              label="Late"
              value={data.summary.late}
              tone="warning"
            />
            <MetricCard
              icon={<ShieldCheck className="h-4 w-4" aria-hidden="true" />}
              label="Excused"
              value={data.summary.excused}
              tone="primary"
            />
          </MetricGrid>

          {data.records.length === 0 ? (
            <EmptyState
              icon={CalendarCheck}
              title="No attendance records"
              description="No attendance was recorded in this date range."
              action={
                range.from || range.to ? (
                  <Button variant="outline" onClick={() => setRange({})}>
                    Reset range
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="panel overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-ink-100 bg-surface-muted/90 text-xs uppercase tracking-wide text-ink-500">
                    <tr>
                      <th className="px-5 py-3.5 font-semibold">Date</th>
                      <th className="px-5 py-3.5 font-semibold">Status</th>
                      <th className="px-5 py-3.5 font-semibold">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    {data.records.map((record) => (
                      <tr key={record.id} className="transition hover:bg-primary-50/30">
                        <td className="px-5 py-3.5 font-medium text-ink-900">
                          {new Date(`${record.date}T00:00:00`).toLocaleDateString(undefined, {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge tone={STATUS_TONE[record.status] ?? 'neutral'}>
                            {record.status}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5 text-ink-600">{record.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : null}
    </ChildPageShell>
  );
}
