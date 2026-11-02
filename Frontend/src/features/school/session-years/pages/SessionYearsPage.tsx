import { useMemo, useState } from 'react';
import { CalendarRange, CheckCircle2, Plus, Search, Users } from 'lucide-react';
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
import { hasActiveFilters, resetListFilters } from '@/lib/list-filters';
import {
  useCreateSessionYear,
  useDeleteSessionYear,
  useSessionYearPlacements,
  useSessionYears,
  useSetCurrentSessionYear,
  useUpdateSessionYear,
  type SessionYear,
  type SessionYearStatus,
} from '../hooks/useSessionYears';

interface YearFilters {
  search?: string;
  status?: SessionYearStatus | 'current' | '';
  page: number;
  limit: number;
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function statusTone(year: SessionYear): 'success' | 'primary' | 'neutral' | 'warning' {
  if (year.isCurrent) return 'success';
  if (year.status === 'closed') return 'neutral';
  if (year.status === 'planned') return 'warning';
  return 'primary';
}

function statusLabel(year: SessionYear) {
  if (year.isCurrent) return 'current';
  return year.status;
}

export function SessionYearsPage() {
  const { can } = usePermission();
  const canWrite = can('session_years.write') || can('settings.school.edit');
  const [filters, setFilters] = useState<YearFilters>({ page: 1, limit: 20 });
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<SessionYear | null>(null);
  const [previewing, setPreviewing] = useState<SessionYear | null>(null);
  const [deleting, setDeleting] = useState<SessionYear | null>(null);

  const yearsQuery = useSessionYears();
  const setCurrent = useSetCurrentSessionYear();
  const deleteYear = useDeleteSessionYear();
  const items = yearsQuery.data ?? [];

  const filtered = useMemo(() => {
    const search = filters.search?.trim().toLowerCase() ?? '';
    return items.filter((year) => {
      if (search && !year.name.toLowerCase().includes(search)) return false;
      if (!filters.status) return true;
      if (filters.status === 'current') return year.isCurrent;
      if (filters.status === 'active') return year.status === 'active' || year.isCurrent;
      return year.status === filters.status;
    });
  }, [items, filters.search, filters.status]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / filters.limit));
  const page = Math.min(filters.page, totalPages);
  const pageItems = filtered.slice((page - 1) * filters.limit, page * filters.limit);
  const filtersActive = hasActiveFilters(filters);

  const currentCount = items.filter((year) => year.isCurrent).length;
  const closedCount = items.filter((year) => year.status === 'closed').length;
  const plannedCount = items.filter((year) => year.status === 'planned' && !year.isCurrent).length;

  return (
    <AppLayout>
      <PageShell
        eyebrow="Academic"
        title="Session years"
        description="Define academic years and mark the current session used for placements and promotions."
        actions={
          canWrite ? (
            <Button onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" /> New session year
            </Button>
          ) : undefined
        }
      >
        {!yearsQuery.isPending && !yearsQuery.error && items.length > 0 && (
          <MetricGrid>
            <MetricCard
              icon={<CalendarRange className="h-4 w-4" aria-hidden="true" />}
              label="Total years"
              value={items.length}
              tone="primary"
            />
            <MetricCard
              icon={<CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
              label="Current"
              value={currentCount}
              tone="success"
            />
            <MetricCard
              icon={<CalendarRange className="h-4 w-4" aria-hidden="true" />}
              label="Planned"
              value={plannedCount}
              tone="warning"
            />
            <MetricCard
              icon={<CalendarRange className="h-4 w-4" aria-hidden="true" />}
              label="Closed"
              value={closedCount}
              tone="neutral"
            />
          </MetricGrid>
        )}

        <FiltersPanel
          description="Search by name or filter by status."
          pageLimit={filters.limit}
          onPageLimitChange={(limit) => setFilters((current) => ({ ...current, limit, page: 1 }))}
          onClear={() => setFilters((current) => resetListFilters(current))}
          clearDisabled={!filtersActive}
        >
          <FilterField id="session-search" label="Search" className="md:col-span-6">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
                aria-hidden="true"
              />
              <Input
                id="session-search"
                className="pl-9"
                placeholder="e.g. 2025-2026"
                value={filters.search ?? ''}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    search: event.target.value || undefined,
                    page: 1,
                  }))
                }
              />
            </div>
          </FilterField>
          <FilterField id="session-status" label="Status" className="md:col-span-6">
            <select
              id="session-status"
              className="field-select"
              value={filters.status ?? ''}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  status: (event.target.value || undefined) as YearFilters['status'],
                  page: 1,
                }))
              }
            >
              <option value="">All statuses</option>
              <option value="current">Current</option>
              <option value="active">Active</option>
              <option value="planned">Planned</option>
              <option value="closed">Closed</option>
            </select>
          </FilterField>
        </FiltersPanel>

        {yearsQuery.isPending ? (
          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-ink-100">
            <PageLoader compact />
          </div>
        ) : yearsQuery.error ? (
          <section className="rounded-2xl border border-danger-100 bg-white p-8 text-center shadow-sm">
            <h2 className="font-display font-semibold text-ink-950">Failed to load session years</h2>
            <p className="mt-2 text-sm text-ink-600">{yearsQuery.error.message}</p>
            <Button
              className="mt-4"
              variant="outline"
              onClick={() => void yearsQuery.refetch()}
              isLoading={yearsQuery.isFetching}
            >
              Try again
            </Button>
          </section>
        ) : items.length === 0 ? (
          <EmptyState
            icon={CalendarRange}
            title="No session years yet"
            description="Create your first academic session (for example 2025-2026)."
            action={
              canWrite ? (
                <Button onClick={() => setCreating(true)}>
                  <Plus className="h-4 w-4" aria-hidden="true" /> New session year
                </Button>
              ) : undefined
            }
          />
        ) : pageItems.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No matching session years"
            description="Try another search or clear your filters."
            action={
              <Button
                variant="outline"
                onClick={() => setFilters((current) => resetListFilters(current))}
              >
                Clear filters
              </Button>
            }
          />
        ) : (
          <>
            <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-ink-100">
              <ul className="divide-y divide-ink-100">
                {pageItems.map((year) => (
                  <li
                    key={year.id}
                    className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                  >
                    <div className="min-w-0">
                      <div className="mb-1.5 flex flex-wrap gap-2">
                        <Badge tone={statusTone(year)}>{statusLabel(year)}</Badge>
                        {year.isCurrent ? <Badge tone="primary">in use</Badge> : null}
                      </div>
                      <p className="font-display text-base font-semibold text-ink-950">{year.name}</p>
                      <p className="mt-1 text-sm text-ink-600">
                        {formatDate(year.startDate)} → {formatDate(year.endDate)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      {!year.isCurrent && year.status !== 'closed' && canWrite ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setCurrent.mutate(year.id)}
                          isLoading={setCurrent.isPending}
                        >
                          <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Set current
                        </Button>
                      ) : null}
                      <RowActions
                        onPreview={() => setPreviewing(year)}
                        onEdit={canWrite ? () => setEditing(year) : undefined}
                        onDelete={
                          canWrite && !year.isCurrent ? () => setDeleting(year) : undefined
                        }
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <ListPagination
              page={page}
              totalPages={totalPages}
              total={total}
              limit={filters.limit}
              onPageChange={(nextPage) => setFilters((current) => ({ ...current, page: nextPage }))}
            />
          </>
        )}
      </PageShell>

      {creating ? <SessionYearFormModal mode="create" onClose={() => setCreating(false)} /> : null}
      {editing ? (
        <SessionYearFormModal mode="edit" year={editing} onClose={() => setEditing(null)} />
      ) : null}
      {previewing ? (
        <SessionYearPreviewModal year={previewing} onClose={() => setPreviewing(null)} />
      ) : null}

      <ConfirmDialog
        open={deleting !== null}
        title="Delete session year"
        description={
          deleting
            ? `Delete "${deleting.name}"? Years with placements cannot be deleted.`
            : ''
        }
        confirmLabel="Delete"
        loading={deleteYear.isPending}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return;
          deleteYear.mutate(deleting.id, { onSettled: () => setDeleting(null) });
        }}
      />
    </AppLayout>
  );
}

function SessionYearFormModal({
  mode,
  year,
  onClose,
}: {
  mode: 'create' | 'edit';
  year?: SessionYear;
  onClose: () => void;
}) {
  const createYear = useCreateSessionYear();
  const updateYear = useUpdateSessionYear();
  const [name, setName] = useState(year?.name ?? '');
  const [startDate, setStartDate] = useState(year?.startDate ?? '');
  const [endDate, setEndDate] = useState(year?.endDate ?? '');
  const [status, setStatus] = useState<SessionYearStatus>(year?.status ?? 'planned');
  const [setAsCurrent, setSetAsCurrent] = useState(mode === 'create');

  const pending = createYear.isPending || updateYear.isPending;
  const canSubmit = name.trim().length >= 4 && startDate && endDate && endDate >= startDate;

  return (
    <Modal
      open
      onClose={onClose}
      title={mode === 'create' ? 'New session year' : 'Edit session year'}
      description={mode === 'create' ? 'Example name: 2025-2026' : 'Update dates or status for this academic year.'}
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
              if (mode === 'create') {
                createYear.mutate(
                  {
                    name: name.trim(),
                    startDate,
                    endDate,
                    setAsCurrent,
                  },
                  { onSuccess: onClose },
                );
                return;
              }
              if (!year) return;
              updateYear.mutate(
                {
                  id: year.id,
                  data: {
                    name: name.trim(),
                    startDate,
                    endDate,
                    status,
                  },
                },
                { onSuccess: onClose },
              );
            }}
          >
            {mode === 'create' ? 'Create' : 'Save changes'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          label="Name *"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="2025-2026"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Start date *"
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
          />
          <Input
            label="End date *"
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
          />
        </div>
        {mode === 'create' ? (
          <label className="flex items-center gap-2 text-sm text-ink-800">
            <input
              type="checkbox"
              checked={setAsCurrent}
              onChange={(event) => setSetAsCurrent(event.target.checked)}
              className="h-4 w-4 rounded border-ink-300"
            />
            Set as current session year
          </label>
        ) : (
          <div>
            <label htmlFor="session-edit-status" className="mb-1.5 block text-sm font-medium text-ink-800">
              Status
            </label>
            <select
              id="session-edit-status"
              className="field-select"
              value={status}
              onChange={(event) => setStatus(event.target.value as SessionYearStatus)}
            >
              <option value="planned">Planned</option>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
            </select>
            <p className="mt-1.5 text-xs text-ink-500">
              Setting status to Active also marks this year as current.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}

function SessionYearPreviewModal({
  year,
  onClose,
}: {
  year: SessionYear;
  onClose: () => void;
}) {
  const placementsQuery = useSessionYearPlacements(year.id);
  const placements = placementsQuery.data ?? [];
  const byClass = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of placements) {
      map.set(row.className, (map.get(row.className) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [placements]);

  return (
    <Modal
      open
      onClose={onClose}
      title={year.name}
      description="Session year details and student placements."
      footer={
        <Button type="button" variant="outline" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="space-y-5">
        <div className="flex flex-wrap gap-2">
          <Badge tone={statusTone(year)}>{statusLabel(year)}</Badge>
          {year.isCurrent ? <Badge tone="primary">in use</Badge> : null}
        </div>

        <dl className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-ink-50/80 px-3 py-2.5 ring-1 ring-ink-100">
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">
              Start
            </dt>
            <dd className="mt-1 text-sm font-medium text-ink-900">{formatDate(year.startDate)}</dd>
          </div>
          <div className="rounded-xl bg-ink-50/80 px-3 py-2.5 ring-1 ring-ink-100">
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">End</dt>
            <dd className="mt-1 text-sm font-medium text-ink-900">{formatDate(year.endDate)}</dd>
          </div>
          <div className="rounded-xl bg-ink-50/80 px-3 py-2.5 ring-1 ring-ink-100">
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">
              Created
            </dt>
            <dd className="mt-1 text-sm font-medium text-ink-900">
              {new Date(year.createdAt).toLocaleString()}
            </dd>
          </div>
          <div className="rounded-xl bg-ink-50/80 px-3 py-2.5 ring-1 ring-ink-100">
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">
              Updated
            </dt>
            <dd className="mt-1 text-sm font-medium text-ink-900">
              {new Date(year.updatedAt).toLocaleString()}
            </dd>
          </div>
        </dl>

        <div>
          <div className="mb-2 flex items-center gap-2">
            <Users className="h-4 w-4 text-ink-500" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-ink-900">Placements</h3>
          </div>
          {placementsQuery.isPending ? (
            <PageLoader compact />
          ) : placementsQuery.error ? (
            <p className="text-sm text-danger-700">{placementsQuery.error.message}</p>
          ) : placements.length === 0 ? (
            <p className="rounded-xl bg-ink-50 px-3 py-3 text-sm text-ink-600 ring-1 ring-ink-100">
              No student placements recorded for this session year yet.
            </p>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-ink-600">
                <span className="font-semibold text-ink-900">{placements.length}</span> student
                {placements.length === 1 ? '' : 's'} placed
              </p>
              <ul className="max-h-48 space-y-1.5 overflow-y-auto rounded-xl bg-ink-50/60 p-3 ring-1 ring-ink-100">
                {byClass.map(([className, count]) => (
                  <li
                    key={className}
                    className="flex items-center justify-between text-sm text-ink-800"
                  >
                    <span>{className}</span>
                    <span className="font-medium text-ink-950">{count}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
