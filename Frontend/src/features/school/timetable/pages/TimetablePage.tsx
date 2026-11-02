import { useMemo, useState } from 'react';
import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  Coffee,
  LayoutGrid,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { FilterField, FiltersPanel } from '@/components/ui/filters-panel';
import { Input } from '@/components/ui/input';
import { ListPagination } from '@/components/ui/list-pagination';
import { MetricCard, MetricGrid } from '@/components/ui/metric-card';
import { Modal } from '@/components/ui/modal';
import { PageShell } from '@/components/ui/page-shell';
import { PageLoader } from '@/components/ui/spinner';
import { RowActions } from '@/components/ui/row-actions';
import { usePermission } from '@/hooks/usePermission';
import { useTenantDateTime } from '@/hooks/useTenantDateTime';
import { hasActiveFilters, resetListFilters } from '@/lib/list-filters';
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

interface PeriodFilters {
  search?: string;
  kind?: 'break' | 'class' | '';
  page: number;
  limit: number;
}

export function TimetablePage() {
  const { can } = usePermission();
  const canWrite = can('timetable.write');

  const [tab, setTab] = useState<Tab>('grid');
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [periodFilters, setPeriodFilters] = useState<PeriodFilters>({ page: 1, limit: 20 });

  const [editingSlot, setEditingSlot] = useState<{
    period: TimetablePeriod;
    dayOfWeek: TimetableDay;
    entry?: TimetableEntry;
  } | null>(null);
  const [previewingSlot, setPreviewingSlot] = useState<{
    period: TimetablePeriod;
    dayOfWeek: TimetableDay;
    entry: TimetableEntry;
  } | null>(null);
  const [creatingPeriod, setCreatingPeriod] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<TimetablePeriod | null>(null);
  const [previewingPeriod, setPreviewingPeriod] = useState<TimetablePeriod | null>(null);
  const [deletingPeriod, setDeletingPeriod] = useState<TimetablePeriod | null>(null);
  const [clearingEntry, setClearingEntry] = useState<TimetableEntry | null>(null);

  const classesQuery = useClasses();
  const sectionsQuery = useSections(classId);
  const subjectsQuery = useSubjects();
  const teachersQuery = useTeachers({ page: 1, limit: 100 });
  const periodsQuery = useTimetablePeriods({ enabled: tab === 'periods' || Boolean(sectionId) });
  const gridQuery = useSectionTimetable(sectionId || undefined, {
    enabled: tab === 'grid' && Boolean(sectionId),
  });
  const deletePeriod = useDeleteTimetablePeriod();
  const deleteEntry = useDeleteTimetableEntry();

  const classes = classesQuery.data ?? [];
  const sections = sectionsQuery.data ?? [];
  const subjects = subjectsQuery.data ?? [];
  const teachers = teachersQuery.data?.items ?? [];
  const allPeriods = periodsQuery.data ?? gridQuery.data?.periods ?? [];
  const gridPeriods = gridQuery.data?.periods ?? allPeriods;
  const entries = gridQuery.data?.entries ?? [];

  const entryMap = useMemo(() => {
    const map = new Map<string, TimetableEntry>();
    for (const entry of entries) {
      map.set(`${entry.dayOfWeek}:${entry.periodId}`, entry);
    }
    return map;
  }, [entries]);

  const teachingPeriods = gridPeriods.filter((period) => !period.isBreak);
  const assignableSlots = teachingPeriods.length * DAYS.length;
  const filledSlots = entries.filter((entry) => {
    const period = gridPeriods.find((item) => item.id === entry.periodId);
    return period && !period.isBreak && (entry.subjectId || entry.teacherId);
  }).length;

  const filteredPeriods = useMemo(() => {
    const search = periodFilters.search?.trim().toLowerCase() ?? '';
    return allPeriods.filter((period) => {
      if (search && !period.name.toLowerCase().includes(search)) return false;
      if (periodFilters.kind === 'break') return period.isBreak;
      if (periodFilters.kind === 'class') return !period.isBreak;
      return true;
    });
  }, [allPeriods, periodFilters.search, periodFilters.kind]);

  const periodTotal = filteredPeriods.length;
  const periodTotalPages = Math.max(1, Math.ceil(periodTotal / periodFilters.limit));
  const periodPage = Math.min(periodFilters.page, periodTotalPages);
  const pagePeriods = filteredPeriods.slice(
    (periodPage - 1) * periodFilters.limit,
    periodPage * periodFilters.limit,
  );
  const periodFiltersActive = hasActiveFilters(periodFilters);
  const selectedSection = sections.find((section) => section.id === sectionId);
  const selectedClass = classes.find((item) => item.id === classId);

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
            <LayoutGrid className="h-4 w-4" aria-hidden="true" /> Weekly grid
          </Button>
          <Button
            type="button"
            size="sm"
            variant={tab === 'periods' ? 'primary' : 'outline'}
            onClick={() => setTab('periods')}
          >
            <Clock3 className="h-4 w-4" aria-hidden="true" /> Periods
          </Button>
        </div>

        {tab === 'grid' ? (
          <>
            {(sectionId || allPeriods.length > 0) && !gridQuery.isPending && !gridQuery.error ? (
              <MetricGrid>
                <MetricCard
                  icon={<Clock3 className="h-4 w-4" aria-hidden="true" />}
                  label="Periods"
                  value={gridPeriods.length}
                  tone="primary"
                />
                <MetricCard
                  icon={<CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
                  label="Filled slots"
                  value={sectionId ? `${filledSlots}/${assignableSlots || 0}` : '—'}
                  tone="success"
                />
                <MetricCard
                  icon={<Coffee className="h-4 w-4" aria-hidden="true" />}
                  label="Breaks"
                  value={gridPeriods.filter((period) => period.isBreak).length}
                  tone="warning"
                />
                <MetricCard
                  icon={<CalendarClock className="h-4 w-4" aria-hidden="true" />}
                  label="Section"
                  value={
                    selectedSection
                      ? selectedSection.fullName || selectedSection.name
                      : 'Not selected'
                  }
                  tone="neutral"
                />
              </MetricGrid>
            ) : null}

            <FiltersPanel
              description="Choose a class and section to view or edit its weekly timetable."
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
                <Button
                  className="mt-4"
                  variant="outline"
                  onClick={() => void gridQuery.refetch()}
                  isLoading={gridQuery.isFetching}
                >
                  Try again
                </Button>
              </section>
            ) : gridPeriods.length === 0 ? (
              <EmptyState
                icon={Clock3}
                title="No periods defined"
                description="Add school periods before assigning subjects to the weekly grid."
                action={
                  canWrite ? (
                    <Button
                      onClick={() => {
                        setTab('periods');
                        setCreatingPeriod(true);
                      }}
                    >
                      <Plus className="h-4 w-4" aria-hidden="true" /> Add period
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-ink-100">
                <header className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-100 px-4 py-3 sm:px-5">
                  <div>
                    <p className="font-display text-sm font-semibold text-ink-950">
                      {selectedClass?.name ?? 'Class'} ·{' '}
                      {selectedSection?.fullName || selectedSection?.name || 'Section'}
                    </p>
                    <p className="text-xs text-ink-500">
                      {canWrite
                        ? 'Click a slot to assign, or use Preview / Clear on filled cells.'
                        : 'Read-only view of the weekly schedule.'}
                    </p>
                  </div>
                  <Badge tone="primary">
                    {filledSlots}/{assignableSlots} filled
                  </Badge>
                </header>
                <div className="overflow-x-auto">
                  <table className="min-w-[860px] w-full border-collapse text-sm">
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
                      {gridPeriods.map((period) => (
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
                                  className={`rounded-xl border px-2.5 py-2 ${
                                    entry
                                      ? 'border-primary-100 bg-primary-50/40'
                                      : 'border-dashed border-ink-200 bg-white'
                                  }`}
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
                                        <p className="mt-0.5 text-xs text-ink-400">
                                          Room {entry.room}
                                        </p>
                                      ) : null}
                                      <div className="mt-1">
                                        <RowActions
                                          className="justify-start"
                                          onPreview={() =>
                                            setPreviewingSlot({
                                              period,
                                              dayOfWeek: day.value,
                                              entry,
                                            })
                                          }
                                          onEdit={
                                            canWrite
                                              ? () =>
                                                  setEditingSlot({
                                                    period,
                                                    dayOfWeek: day.value,
                                                    entry,
                                                  })
                                              : undefined
                                          }
                                          onDelete={
                                            canWrite ? () => setClearingEntry(entry) : undefined
                                          }
                                          deleteLabel="Clear slot"
                                        />
                                      </div>
                                    </>
                                  ) : canWrite ? (
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      className="h-8 w-full justify-center border-dashed text-xs"
                                      onClick={() =>
                                        setEditingSlot({
                                          period,
                                          dayOfWeek: day.value,
                                        })
                                      }
                                    >
                                      <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Assign
                                    </Button>
                                  ) : (
                                    <p className="text-xs text-ink-400">Empty</p>
                                  )}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </>
        ) : (
          <>
            {!periodsQuery.isPending && !periodsQuery.error && allPeriods.length > 0 ? (
              <MetricGrid>
                <MetricCard
                  icon={<Clock3 className="h-4 w-4" aria-hidden="true" />}
                  label="Total periods"
                  value={allPeriods.length}
                  tone="primary"
                />
                <MetricCard
                  icon={<CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
                  label="Class periods"
                  value={allPeriods.filter((period) => !period.isBreak).length}
                  tone="success"
                />
                <MetricCard
                  icon={<Coffee className="h-4 w-4" aria-hidden="true" />}
                  label="Breaks"
                  value={allPeriods.filter((period) => period.isBreak).length}
                  tone="warning"
                />
              </MetricGrid>
            ) : null}

            <FiltersPanel
              description="Search periods or filter by type."
              pageLimit={periodFilters.limit}
              onPageLimitChange={(limit) =>
                setPeriodFilters((current) => ({ ...current, limit, page: 1 }))
              }
              onClear={() => setPeriodFilters((current) => resetListFilters(current))}
              clearDisabled={!periodFiltersActive}
            >
              <FilterField id="period-search" label="Search" className="md:col-span-6">
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
                    aria-hidden="true"
                  />
                  <Input
                    id="period-search"
                    className="pl-9"
                    placeholder="Period name"
                    value={periodFilters.search ?? ''}
                    onChange={(event) =>
                      setPeriodFilters((current) => ({
                        ...current,
                        search: event.target.value || undefined,
                        page: 1,
                      }))
                    }
                  />
                </div>
              </FilterField>
              <FilterField id="period-kind" label="Type" className="md:col-span-6">
                <select
                  id="period-kind"
                  className="field-select"
                  value={periodFilters.kind ?? ''}
                  onChange={(event) =>
                    setPeriodFilters((current) => ({
                      ...current,
                      kind: (event.target.value || undefined) as PeriodFilters['kind'],
                      page: 1,
                    }))
                  }
                >
                  <option value="">All types</option>
                  <option value="class">Class periods</option>
                  <option value="break">Breaks</option>
                </select>
              </FilterField>
            </FiltersPanel>

            {periodsQuery.isPending ? (
              <div className="rounded-2xl bg-white shadow-sm ring-1 ring-ink-100">
                <PageLoader compact />
              </div>
            ) : periodsQuery.error ? (
              <section className="rounded-2xl border border-danger-100 bg-white p-8 text-center shadow-sm">
                <h2 className="font-display font-semibold text-ink-950">Failed to load periods</h2>
                <p className="mt-2 text-sm text-ink-600">{periodsQuery.error.message}</p>
                <Button
                  className="mt-4"
                  variant="outline"
                  onClick={() => void periodsQuery.refetch()}
                  isLoading={periodsQuery.isFetching}
                >
                  Try again
                </Button>
              </section>
            ) : allPeriods.length === 0 ? (
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
            ) : pagePeriods.length === 0 ? (
              <EmptyState
                icon={Search}
                title="No matching periods"
                description="Try another search or clear your filters."
                action={
                  <Button
                    variant="outline"
                    onClick={() => setPeriodFilters((current) => resetListFilters(current))}
                  >
                    Clear filters
                  </Button>
                }
              />
            ) : (
              <>
                <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-ink-100">
                  <ul className="divide-y divide-ink-100">
                    {pagePeriods.map((period) => (
                      <li
                        key={period.id}
                        className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                      >
                        <div className="min-w-0">
                          <div className="mb-1.5 flex flex-wrap gap-2">
                            {period.isBreak ? (
                              <Badge tone="warning">Break</Badge>
                            ) : (
                              <Badge tone="primary">Class</Badge>
                            )}
                            <Badge tone="neutral">Order {period.sortOrder}</Badge>
                          </div>
                          <p className="font-display text-base font-semibold text-ink-950">
                            {period.name}
                          </p>
                          <p className="mt-1 text-sm text-ink-600">
                            {period.startTime} – {period.endTime}
                          </p>
                        </div>
                        <RowActions
                          onPreview={() => setPreviewingPeriod(period)}
                          onEdit={canWrite ? () => setEditingPeriod(period) : undefined}
                          onDelete={canWrite ? () => setDeletingPeriod(period) : undefined}
                        />
                      </li>
                    ))}
                  </ul>
                </section>

                <ListPagination
                  page={periodPage}
                  totalPages={periodTotalPages}
                  total={periodTotal}
                  limit={periodFilters.limit}
                  onPageChange={(page) =>
                    setPeriodFilters((current) => ({ ...current, page }))
                  }
                />
              </>
            )}
          </>
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
        />
      ) : null}

      {previewingSlot ? (
        <SlotPreviewModal
          period={previewingSlot.period}
          dayOfWeek={previewingSlot.dayOfWeek}
          entry={previewingSlot.entry}
          canWrite={canWrite}
          onClose={() => setPreviewingSlot(null)}
          onEdit={() => {
            setEditingSlot({
              period: previewingSlot.period,
              dayOfWeek: previewingSlot.dayOfWeek,
              entry: previewingSlot.entry,
            });
            setPreviewingSlot(null);
          }}
          onClear={() => {
            setClearingEntry(previewingSlot.entry);
            setPreviewingSlot(null);
          }}
        />
      ) : null}

      {previewingPeriod ? (
        <PeriodPreviewModal
          period={previewingPeriod}
          canWrite={canWrite}
          onClose={() => setPreviewingPeriod(null)}
          onEdit={() => {
            setEditingPeriod(previewingPeriod);
            setPreviewingPeriod(null);
          }}
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

      <ConfirmDialog
        open={clearingEntry !== null}
        title="Clear timetable slot"
        description={
          clearingEntry
            ? `Remove ${clearingEntry.subjectName ?? 'this assignment'} from the timetable?`
            : ''
        }
        confirmLabel="Clear"
        loading={deleteEntry.isPending}
        onClose={() => setClearingEntry(null)}
        onConfirm={() => {
          if (!clearingEntry || !sectionId) return;
          deleteEntry.mutate(
            { id: clearingEntry.id, sectionId },
            { onSettled: () => setClearingEntry(null) },
          );
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
}: {
  sectionId: string;
  period: TimetablePeriod;
  dayOfWeek: TimetableDay;
  entry?: TimetableEntry;
  subjects: { id: string; name: string; code: string }[];
  teachers: { id: string; fullName: string }[];
  onClose: () => void;
}) {
  const upsert = useUpsertTimetableEntry();
  const [subjectId, setSubjectId] = useState(entry?.subjectId ?? '');
  const [teacherId, setTeacherId] = useState(entry?.teacherId ?? '');
  const [room, setRoom] = useState(entry?.room ?? '');
  const dayLabel = DAYS.find((day) => day.value === dayOfWeek)?.label ?? String(dayOfWeek);

  return (
    <Modal
      open
      onClose={onClose}
      title={entry ? 'Edit slot' : 'Assign slot'}
      description={`${period.name} · ${dayLabel} · ${period.startTime}–${period.endTime}`}
      closeDisabled={upsert.isPending}
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={upsert.isPending}>
            Cancel
          </Button>
          <Button
            type="button"
            isLoading={upsert.isPending}
            onClick={() =>
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
              )
            }
          >
            Save
          </Button>
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

function SlotPreviewModal({
  period,
  dayOfWeek,
  entry,
  canWrite,
  onClose,
  onEdit,
  onClear,
}: {
  period: TimetablePeriod;
  dayOfWeek: TimetableDay;
  entry: TimetableEntry;
  canWrite: boolean;
  onClose: () => void;
  onEdit: () => void;
  onClear: () => void;
}) {
  const dayLabel = DAYS.find((day) => day.value === dayOfWeek)?.label ?? String(dayOfWeek);

  return (
    <Modal
      open
      onClose={onClose}
      title="Slot preview"
      description={`${period.name} · ${dayLabel}`}
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
          {canWrite ? (
            <>
              <Button type="button" variant="ghost" onClick={onClear}>
                <Trash2 className="h-4 w-4 text-danger-600" aria-hidden="true" /> Clear
              </Button>
              <Button type="button" onClick={onEdit}>
                <Pencil className="h-4 w-4" aria-hidden="true" /> Edit
              </Button>
            </>
          ) : null}
        </>
      }
    >
      <dl className="grid gap-3 sm:grid-cols-2">
        <PreviewField label="Subject" value={entry.subjectName ?? '—'} />
        <PreviewField label="Code" value={entry.subjectCode ?? '—'} />
        <PreviewField label="Teacher" value={entry.teacherName ?? '—'} />
        <PreviewField label="Room" value={entry.room ? `Room ${entry.room}` : '—'} />
        <PreviewField label="Time" value={`${period.startTime}–${period.endTime}`} />
        <PreviewField label="Day" value={dayLabel} />
      </dl>
    </Modal>
  );
}

function PeriodPreviewModal({
  period,
  canWrite,
  onClose,
  onEdit,
}: {
  period: TimetablePeriod;
  canWrite: boolean;
  onClose: () => void;
  onEdit: () => void;
}) {
  const { formatDateTime } = useTenantDateTime();
  return (
    <Modal
      open
      onClose={onClose}
      title={period.name}
      description="Period details"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
          {canWrite ? (
            <Button type="button" onClick={onEdit}>
              <Pencil className="h-4 w-4" aria-hidden="true" /> Edit
            </Button>
          ) : null}
        </>
      }
    >
      <div className="mb-4 flex flex-wrap gap-2">
        {period.isBreak ? <Badge tone="warning">Break</Badge> : <Badge tone="primary">Class</Badge>}
        <Badge tone="neutral">Order {period.sortOrder}</Badge>
      </div>
      <dl className="grid gap-3 sm:grid-cols-2">
        <PreviewField label="Start" value={period.startTime} />
        <PreviewField label="End" value={period.endTime} />
        <PreviewField label="Created" value={formatDateTime(period.createdAt)} />
        <PreviewField label="Updated" value={formatDateTime(period.updatedAt)} />
      </dl>
    </Modal>
  );
}

function PreviewField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-ink-50/80 px-3 py-2.5 ring-1 ring-ink-100">
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-ink-900">{value}</dd>
    </div>
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

  const canSubmit = name.trim().length > 0 && startTime && endTime && endTime > startTime;

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? 'Edit period' : 'Add period'}
      description={isEdit ? 'Update period timing or type.' : 'Create a class period or break.'}
      closeDisabled={pending}
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!canSubmit || pending}
            isLoading={pending}
            onClick={() => {
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
            }}
          >
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
            className="h-4 w-4 rounded border-ink-300"
          />
          Break / free period
        </label>
      </div>
    </Modal>
  );
}
