import { useMemo, useState } from 'react';
import { CalendarClock, Pencil, Plus, Trash2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { FilterField, FiltersPanel } from '@/components/ui/filters-panel';
import { PageShell } from '@/components/ui/page-shell';
import { PageLoader } from '@/components/ui/spinner';
import { usePermission } from '@/hooks/usePermission';
import { useClasses } from '@/features/school/classes/hooks/useClasses';
import { useSections } from '@/features/school/classes/hooks/useSections';
import { useSubjects } from '@/features/school/subjects/hooks/useSubjects';
import { useTeachers } from '@/features/school/teachers/hooks/useTeachers';
import {
  useCreateTimetablePeriod,
  useDeleteTimetableEntry,
  useDeleteTimetablePeriod,
  useSectionTimetable,
  useTimetablePeriods,
  useUpdateTimetablePeriod,
  useUpsertTimetableEntry,
  type TimetableEntry,
  type TimetablePeriod,
} from '../hooks/useTimetable';
import type { TimetableDay } from '../hooks/keys';

type Tab = 'grid' | 'periods';

const DAYS: { value: TimetableDay; label: string; short: string }[] = [
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
];

export function TimetablePage() {
  const { can } = usePermission();
  const canWrite = can('timetable.write');

  const [tab, setTab] = useState<Tab>('grid');
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [editingSlot, setEditingSlot] = useState<{
    period: TimetablePeriod;
    dayOfWeek: TimetableDay;
    entry?: TimetableEntry;
  } | null>(null);
  const [creatingPeriod, setCreatingPeriod] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<TimetablePeriod | null>(null);
  const [deletingPeriod, setDeletingPeriod] = useState<TimetablePeriod | null>(null);

  const classesQuery = useClasses();
  const sectionsQuery = useSections(classId);
  const subjectsQuery = useSubjects();
  const teachersQuery = useTeachers({ page: 1, limit: 100 });
  const periodsQuery = useTimetablePeriods({ enabled: tab === 'periods' });
  const gridQuery = useSectionTimetable(sectionId || undefined, {
    enabled: tab === 'grid' && Boolean(sectionId),
  });
  const deletePeriod = useDeleteTimetablePeriod();
  const deleteEntry = useDeleteTimetableEntry();

  const classes = classesQuery.data ?? [];
  const sections = sectionsQuery.data ?? [];
  const subjects = subjectsQuery.data ?? [];
  const teachers = teachersQuery.data?.items ?? [];
  const periods = periodsQuery.data ?? gridQuery.data?.periods ?? [];
  const entries = gridQuery.data?.entries ?? [];

  const entryMap = useMemo(() => {
    const map = new Map<string, TimetableEntry>();
    for (const entry of entries) {
      map.set(`${entry.dayOfWeek}:${entry.periodId}`, entry);
    }
    return map;
  }, [entries]);

  return (
    <AppLayout>
      <PageShell
          eyebrow="Academic"
          title="Timetable"
          description="Build weekly class schedules by section, period, and day."
          actions={
            tab === 'periods' && canWrite ? (
              <Button onClick={() => setCreatingPeriod(true)}>
                <Plus className="h-4 w-4" aria-hidden="true" /> Add period
              </Button>
            ) : undefined
          }
      >
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={tab === 'grid' ? 'primary' : 'outline'}
            onClick={() => setTab('grid')}
          >
            Weekly grid
          </Button>
          <Button
            type="button"
            size="sm"
            variant={tab === 'periods' ? 'primary' : 'outline'}
            onClick={() => setTab('periods')}
          >
            Periods
          </Button>
        </div>

        {tab === 'grid' ? (
          <>
            <FiltersPanel
              description="Choose a class and section to view its weekly timetable."
              onClear={() => {
                setClassId('');
                setSectionId('');
              }}
              clearDisabled={!classId && !sectionId}
            >
              <FilterField id="tt-class" label="Class" className="md:col-span-6">
                <select
                  id="tt-class"
                  className="field-select"
                  value={classId}
                  onChange={(event) => {
                    setClassId(event.target.value);
                    setSectionId('');
                  }}
                >
                  <option value="">Select class</option>
                  {classes.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </FilterField>
              <FilterField id="tt-section" label="Section" className="md:col-span-6">
                <select
                  id="tt-section"
                  className="field-select"
                  value={sectionId}
                  disabled={!classId}
                  onChange={(event) => setSectionId(event.target.value)}
                >
                  <option value="">Select section</option>
                  {sections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.fullName || section.name}
                    </option>
                  ))}
                </select>
              </FilterField>
            </FiltersPanel>

            {!sectionId ? (
              <EmptyState
                icon={CalendarClock}
                title="Select a section"
                description="Choose a class and section to view or edit its weekly timetable."
              />
            ) : gridQuery.isPending ? (
              <div className="rounded-2xl bg-white shadow-sm ring-1 ring-ink-100">
                <PageLoader compact />
              </div>
            ) : gridQuery.error ? (
              <section className="rounded-2xl border border-danger-100 bg-white p-8 text-center shadow-sm">
                <h2 className="font-display font-semibold text-ink-950">Failed to load timetable</h2>
                <p className="mt-2 text-sm text-ink-600">{gridQuery.error.message}</p>
              </section>
            ) : (
              <section className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-ink-100">
                <table className="min-w-[720px] w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-ink-100 bg-ink-50/80">
                      <th className="px-3 py-3 text-left font-medium text-ink-600">Period</th>
                      {DAYS.map((day) => (
                        <th
                          key={day.value}
                          className="px-3 py-3 text-left font-medium text-ink-600"
                        >
                          <span className="hidden sm:inline">{day.label}</span>
                          <span className="sm:hidden">{day.short}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(gridQuery.data?.periods ?? []).map((period) => (
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
                              <button
                                type="button"
                                disabled={!canWrite}
                                onClick={() =>
                                  setEditingSlot({
                                    period,
                                    dayOfWeek: day.value,
                                    entry,
                                  })
                                }
                                className={`w-full rounded-lg border px-2 py-2 text-left transition ${
                                  entry
                                    ? 'border-primary-100 bg-primary-50/40 hover:border-primary-200'
                                    : 'border-dashed border-ink-200 hover:border-ink-300 hover:bg-ink-50'
                                } ${canWrite ? '' : 'cursor-default'}`}
                              >
                                {entry ? (
                                  <>
                                    <p className="font-medium text-ink-900">
                                      {entry.subjectName ?? 'Untitled'}
                                    </p>
                                    {entry.teacherName ? (
                                      <p className="mt-0.5 text-xs text-ink-500">
                                        {entry.teacherName}
                                      </p>
                                    ) : null}
                                    {entry.room ? (
                                      <p className="mt-0.5 text-xs text-ink-400">Room {entry.room}</p>
                                    ) : null}
                                  </>
                                ) : (
                                  <p className="text-xs text-ink-400">
                                    {canWrite ? 'Assign' : 'Empty'}
                                  </p>
                                )}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            )}
          </>
        ) : periodsQuery.isPending ? (
          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-ink-100">
            <PageLoader compact />
          </div>
        ) : periodsQuery.error ? (
          <section className="rounded-2xl border border-danger-100 bg-white p-8 text-center shadow-sm">
            <h2 className="font-display font-semibold text-ink-950">Failed to load periods</h2>
            <p className="mt-2 text-sm text-ink-600">{periodsQuery.error.message}</p>
          </section>
        ) : periods.length === 0 ? (
          <EmptyState
            icon={CalendarClock}
            title="No periods"
            description="Add school periods like Period 1, Break, and Lunch."
            action={
              canWrite ? (
                <Button onClick={() => setCreatingPeriod(true)}>
                  <Plus className="h-4 w-4" aria-hidden="true" /> Add period
                </Button>
              ) : undefined
            }
          />
        ) : (
          <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-ink-100">
            <ul className="divide-y divide-ink-100">
              {periods.map((period) => (
                <li
                  key={period.id}
                  className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                >
                  <div>
                    <div className="mb-1 flex flex-wrap gap-2">
                      {period.isBreak ? <Badge tone="warning">Break</Badge> : null}
                      <Badge tone="neutral">Order {period.sortOrder}</Badge>
                    </div>
                    <p className="font-display text-base font-semibold text-ink-950">
                      {period.name}
                    </p>
                    <p className="mt-1 text-sm text-ink-500">
                      {period.startTime} – {period.endTime}
                    </p>
                  </div>
                  {canWrite ? (
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingPeriod(period)}
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" /> Edit
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeletingPeriod(period)}
                        aria-label="Delete period"
                      >
                        <Trash2 className="h-4 w-4 text-danger-600" aria-hidden="true" />
                      </Button>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        )}
      </PageShell>

      {editingSlot && sectionId ? (
        <SlotModal
          sectionId={sectionId}
          period={editingSlot.period}
          dayOfWeek={editingSlot.dayOfWeek}
          entry={editingSlot.entry}
          subjects={subjects}
          teachers={teachers}
          onClose={() => setEditingSlot(null)}
          onClear={
            editingSlot.entry
              ? () =>
                  deleteEntry.mutate(
                    { id: editingSlot.entry!.id, sectionId },
                    { onSuccess: () => setEditingSlot(null) },
                  )
              : undefined
          }
          clearing={deleteEntry.isPending}
        />
      ) : null}

      {(creatingPeriod || editingPeriod) && (
        <PeriodFormModal
          period={editingPeriod}
          onClose={() => {
            setCreatingPeriod(false);
            setEditingPeriod(null);
          }}
        />
      )}

      <ConfirmDialog
        open={deletingPeriod !== null}
        title="Delete period"
        description={
          deletingPeriod
            ? `Delete "${deletingPeriod.name}"? Slots using this period will be cleared.`
            : ''
        }
        confirmLabel="Delete"
        loading={deletePeriod.isPending}
        onClose={() => setDeletingPeriod(null)}
        onConfirm={() => {
          if (!deletingPeriod) return;
          deletePeriod.mutate(deletingPeriod.id, {
            onSettled: () => setDeletingPeriod(null),
          });
        }}
      />
    </AppLayout>
  );
}

function SlotModal({
  sectionId,
  period,
  dayOfWeek,
  entry,
  subjects,
  teachers,
  onClose,
  onClear,
  clearing,
}: {
  sectionId: string;
  period: TimetablePeriod;
  dayOfWeek: TimetableDay;
  entry?: TimetableEntry;
  subjects: { id: string; name: string; code: string }[];
  teachers: { id: string; fullName: string }[];
  onClose: () => void;
  onClear?: () => void;
  clearing?: boolean;
}) {
  const upsert = useUpsertTimetableEntry();
  const [subjectId, setSubjectId] = useState(entry?.subjectId ?? '');
  const [teacherId, setTeacherId] = useState(entry?.teacherId ?? '');
  const [room, setRoom] = useState(entry?.room ?? '');
  const dayLabel = DAYS.find((day) => day.value === dayOfWeek)?.label ?? String(dayOfWeek);

  const submit = () => {
    upsert.mutate(
      {
        sectionId,
        periodId: period.id,
        dayOfWeek,
        subjectId: subjectId || null,
        teacherId: teacherId || null,
        room: room.trim() || null,
      },
      { onSuccess: onClose },
    );
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`${period.name} · ${dayLabel}`}
      description={`${period.startTime}–${period.endTime}`}
      closeDisabled={upsert.isPending || clearing}
      footer={
        <>
          {onClear ? (
            <Button
              type="button"
              variant="ghost"
              onClick={onClear}
              isLoading={clearing}
              disabled={upsert.isPending}
            >
              Clear
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={upsert.isPending || clearing}
            >
              Cancel
            </Button>
            <Button type="button" onClick={submit} isLoading={upsert.isPending}>
              Save
            </Button>
          </div>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="slot-subject" className="mb-1.5 block text-sm font-medium text-ink-800">
            Subject
          </label>
          <select
            id="slot-subject"
            className="field-select"
            value={subjectId}
            onChange={(event) => setSubjectId(event.target.value)}
          >
            <option value="">None</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name} ({subject.code})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="slot-teacher" className="mb-1.5 block text-sm font-medium text-ink-800">
            Teacher
          </label>
          <select
            id="slot-teacher"
            className="field-select"
            value={teacherId}
            onChange={(event) => setTeacherId(event.target.value)}
          >
            <option value="">None</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.fullName}
              </option>
            ))}
          </select>
        </div>
        <Input
          label="Room"
          value={room}
          onChange={(event) => setRoom(event.target.value)}
          placeholder="Optional room / lab"
        />
      </div>
    </Modal>
  );
}

function PeriodFormModal({
  period,
  onClose,
}: {
  period: TimetablePeriod | null;
  onClose: () => void;
}) {
  const createPeriod = useCreateTimetablePeriod();
  const updatePeriod = useUpdateTimetablePeriod();
  const isEdit = Boolean(period);
  const pending = createPeriod.isPending || updatePeriod.isPending;

  const [name, setName] = useState(period?.name ?? '');
  const [startTime, setStartTime] = useState(period?.startTime ?? '08:00');
  const [endTime, setEndTime] = useState(period?.endTime ?? '08:45');
  const [sortOrder, setSortOrder] = useState(String(period?.sortOrder ?? ''));
  const [isBreak, setIsBreak] = useState(period?.isBreak ?? false);

  const submit = () => {
    if (!name.trim()) return;
    const payload = {
      name: name.trim(),
      startTime,
      endTime,
      isBreak,
      ...(sortOrder.trim() ? { sortOrder: Number(sortOrder) } : {}),
    };

    if (isEdit && period) {
      updatePeriod.mutate({ id: period.id, ...payload }, { onSuccess: onClose });
      return;
    }
    createPeriod.mutate(payload, { onSuccess: onClose });
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? 'Edit period' : 'Add period'}
      closeDisabled={pending}
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="button" onClick={submit} isLoading={pending}>
            {isEdit ? 'Save changes' : 'Create period'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input label="Name *" value={name} onChange={(event) => setName(event.target.value)} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Start *"
            type="time"
            value={startTime}
            onChange={(event) => setStartTime(event.target.value)}
          />
          <Input
            label="End *"
            type="time"
            value={endTime}
            onChange={(event) => setEndTime(event.target.value)}
          />
        </div>
        <Input
          label="Sort order"
          type="number"
          min={0}
          value={sortOrder}
          onChange={(event) => setSortOrder(event.target.value)}
          hint="Lower numbers appear first"
        />
        <label className="flex items-center gap-2 text-sm text-ink-700">
          <input
            type="checkbox"
            checked={isBreak}
            onChange={(event) => setIsBreak(event.target.checked)}
            className="rounded border-ink-300"
          />
          Break / free period
        </label>
      </div>
    </Modal>
  );
}
