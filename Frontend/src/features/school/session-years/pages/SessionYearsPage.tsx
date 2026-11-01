import { useState } from 'react';
import { CalendarRange, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { MetricCard, MetricGrid } from '@/components/ui/metric-card';
import { PageShell } from '@/components/ui/page-shell';
import { PageLoader } from '@/components/ui/spinner';
import { usePermission } from '@/hooks/usePermission';
import {
  useCreateSessionYear,
  useDeleteSessionYear,
  useSessionYears,
  useSetCurrentSessionYear,
  type SessionYear,
} from '../hooks/useSessionYears';

export function SessionYearsPage() {
  const { can } = usePermission();
  const canWrite = can('session_years.write') || can('settings.school.edit');
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<SessionYear | null>(null);
  const yearsQuery = useSessionYears();
  const setCurrent = useSetCurrentSessionYear();
  const deleteYear = useDeleteSessionYear();
  const items = yearsQuery.data ?? [];

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
              icon={<CalendarRange className="h-4 w-4" aria-hidden />}
              label="Total years"
              value={items.length}
              tone="primary"
            />
            <MetricCard
              icon={<CheckCircle2 className="h-4 w-4" aria-hidden />}
              label="Current"
              value={items.filter((year) => year.isCurrent).length}
              tone="success"
            />
            <MetricCard
              icon={<CalendarRange className="h-4 w-4" aria-hidden />}
              label="Closed"
              value={items.filter((year) => year.status === 'closed').length}
              tone="neutral"
            />
          </MetricGrid>
        )}

        {yearsQuery.isPending ? (
          <div className="panel">
            <PageLoader compact />
          </div>
        ) : yearsQuery.error ? (
          <section className="panel p-8 text-center">
            <h2 className="font-display font-semibold text-ink-950">Failed to load</h2>
            <p className="mt-2 text-sm text-ink-600">{yearsQuery.error.message}</p>
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
        ) : (
          <div className="space-y-3">
            {items.map((year) => (
              <article key={year.id} className="panel flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5">
                <div>
                  <div className="mb-1 flex flex-wrap gap-2">
                    <Badge tone={year.isCurrent ? 'success' : year.status === 'closed' ? 'neutral' : 'primary'}>
                      {year.isCurrent ? 'current' : year.status}
                    </Badge>
                  </div>
                  <h2 className="font-display text-lg font-semibold text-ink-950">{year.name}</h2>
                  <p className="mt-1 text-sm text-ink-500">
                    {year.startDate} → {year.endDate}
                  </p>
                </div>
                {canWrite && (
                  <div className="flex flex-wrap gap-2">
                    {!year.isCurrent && year.status !== 'closed' && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setCurrent.mutate(year.id)}
                        isLoading={setCurrent.isPending}
                      >
                        <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Set current
                      </Button>
                    )}
                    {!year.isCurrent && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        aria-label="Delete"
                        onClick={() => setDeleting(year)}
                      >
                        <Trash2 className="h-4 w-4 text-danger-600" aria-hidden="true" />
                      </Button>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </PageShell>

      {creating && <CreateSessionYearModal onClose={() => setCreating(false)} />}

      <ConfirmDialog
        open={deleting !== null}
        title="Delete session year"
        description={deleting ? `Delete "${deleting.name}"? Years with placements cannot be deleted.` : ''}
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

function CreateSessionYearModal({ onClose }: { onClose: () => void }) {
  const createYear = useCreateSessionYear();
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [setAsCurrent, setSetAsCurrent] = useState(true);

  const canSubmit = name.trim().length >= 4 && startDate && endDate && endDate >= startDate;

  return (
    <Modal
      open
      onClose={onClose}
      title="New session year"
      description="Example name: 2025-2026"
      closeDisabled={createYear.isPending}
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={createYear.isPending}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!canSubmit || createYear.isPending}
            isLoading={createYear.isPending}
            onClick={() =>
              createYear.mutate(
                {
                  name: name.trim(),
                  startDate,
                  endDate,
                  setAsCurrent,
                },
                { onSuccess: onClose },
              )
            }
          >
            Create
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input label="Name *" value={name} onChange={(event) => setName(event.target.value)} placeholder="2025-2026" />
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
        <label className="flex items-center gap-2 text-sm text-ink-800">
          <input
            type="checkbox"
            checked={setAsCurrent}
            onChange={(event) => setSetAsCurrent(event.target.checked)}
            className="h-4 w-4 rounded border-ink-300"
          />
          Set as current session year
        </label>
      </div>
    </Modal>
  );
}
