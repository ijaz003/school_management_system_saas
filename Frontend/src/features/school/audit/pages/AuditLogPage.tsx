import { useMemo, useState } from 'react';
import {
  ScrollText,
  Search,
  X,
  CalendarDays,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Activity,
  ShieldCheck,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { usePermission } from '@/hooks/usePermission';
import { useAuditLogs } from '../hooks/useAuditLogs';

/* ---------- helpers ---------- */

function monthStart() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    .toISOString()
    .slice(0, 10);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function formatRelative(value: string) {
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function initials(name?: string | null) {
  if (!name) return 'SY';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

/* Deterministic avatar color from name */
const AVATAR_TONES = [
  'bg-sky-50 text-sky-700 ring-sky-100',
  'bg-violet-50 text-violet-700 ring-violet-100',
  'bg-emerald-50 text-emerald-700 ring-emerald-100',
  'bg-amber-50 text-amber-700 ring-amber-100',
  'bg-rose-50 text-rose-700 ring-rose-100',
  'bg-indigo-50 text-indigo-700 ring-indigo-100',
];

function avatarTone(name?: string | null) {
  if (!name) return AVATAR_TONES[0];
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return AVATAR_TONES[Math.abs(hash) % AVATAR_TONES.length];
}

const ENTITY_OPTIONS = [
  { value: '', label: 'All entities' },
  { value: 'fee_structure', label: 'Fee structure' },
  { value: 'fee_invoice', label: 'Fee invoice' },
  { value: 'fee_payment', label: 'Fee payment' },
  { value: 'exam', label: 'Exam' },
  { value: 'tenant', label: 'School settings' },
  { value: 'role', label: 'Role' },
  { value: 'user', label: 'User' },
];

/* ---------- page ---------- */

export function AuditLogPage() {
  const { can } = usePermission();
  const canView =
    can('audit.read') || can('settings.users.manage') || can('settings.school.edit');

  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');
  const [from, setFrom] = useState(monthStart);
  const [to, setTo] = useState(today);

  const query = useAuditLogs(
    {
      page,
      limit: 30,
      action: action || undefined,
      entityType: entityType || undefined,
      from: from || undefined,
      to: to || undefined,
    },
    canView,
  );

  const hasFilters = useMemo(
    () => Boolean(action || entityType || from !== monthStart() || to !== today()),
    [action, entityType, from, to],
  );

  const resetFilters = () => {
    setAction('');
    setEntityType('');
    setFrom(monthStart());
    setTo(today());
    setPage(1);
  };

  if (!canView) {
    return (
      <AppLayout>
        <div className="mx-auto flex max-w-xl flex-col items-center py-20">
          <EmptyState
            icon={ScrollText}
            title="No access"
            description="You need audit log permission to view this page. Contact an administrator if you believe this is a mistake."
          />
        </div>
      </AppLayout>
    );
  }

  const items = query.data?.items ?? [];
  const pagination = query.data?.pagination;

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl space-y-6 pb-12">
        {/* ---------- Page header ---------- */}
        <div className="relative overflow-hidden rounded-2xl border border-ink-100 bg-gradient-to-br from-white via-white to-ink-50/60 px-5 py-6 shadow-sm sm:px-7 sm:py-7">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary-100/40 blur-3xl"
          />
          <div className="relative">
            <PageHeader
              eyebrow="Administration"
              title="Audit log"
              description="Track who changed fees, exams, settings, and roles across your school."
            />
          </div>
        </div>

        {/* ---------- Filters ---------- */}
        <section className="sticky top-4 z-10 rounded-2xl border border-ink-100 bg-white/85 p-4 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-white/70 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-ink-100/70 text-ink-600">
                <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
              </span>
              <div>
                <h2 className="text-[13px] font-semibold tracking-tight text-ink-900">
                  Filters
                </h2>
                <p className="text-[11px] text-ink-500">
                  Narrow down events by date, action, or entity.
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              disabled={!hasFilters}
              className="text-[12px] font-medium text-ink-500 transition hover:text-ink-900 disabled:opacity-40"
            >
              <X className="mr-1 h-3.5 w-3.5" aria-hidden />
              Clear
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <FilterField
              id="audit-from"
              label="From"
              icon={<CalendarDays className="h-3.5 w-3.5" aria-hidden />}
            >
              <input
                id="audit-from"
                type="date"
                className="field-select w-full text-[13px]"
                value={from}
                max={to || undefined}
                onChange={(event) => {
                  setFrom(event.target.value);
                  setPage(1);
                }}
              />
            </FilterField>

            <FilterField
              id="audit-to"
              label="To"
              icon={<CalendarDays className="h-3.5 w-3.5" aria-hidden />}
            >
              <input
                id="audit-to"
                type="date"
                className="field-select w-full text-[13px]"
                value={to}
                min={from || undefined}
                onChange={(event) => {
                  setTo(event.target.value);
                  setPage(1);
                }}
              />
            </FilterField>

            <FilterField
              id="audit-action"
              label="Action"
              icon={<Search className="h-3.5 w-3.5" aria-hidden />}
            >
              <input
                id="audit-action"
                className="field-select w-full font-mono text-[12.5px]"
                placeholder="fees.payment.record"
                value={action}
                onChange={(event) => {
                  setAction(event.target.value.trim());
                  setPage(1);
                }}
              />
            </FilterField>

            <FilterField
              id="audit-entity"
              label="Entity"
              icon={<ScrollText className="h-3.5 w-3.5" aria-hidden />}
            >
              <select
                id="audit-entity"
                className="field-select w-full text-[13px]"
                value={entityType}
                onChange={(event) => {
                  setEntityType(event.target.value);
                  setPage(1);
                }}
              >
                {ENTITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FilterField>
          </div>

          {hasFilters && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-ink-100 pt-3">
              <span className="text-[11px] font-medium uppercase tracking-wider text-ink-400">
                Active
              </span>
              {action && <FilterChip label={action} mono />}
              {entityType && <FilterChip label={entityType.replace(/_/g, ' ')} />}
              {(from !== monthStart() || to !== today()) && (
                <FilterChip label={`${from || '…'} → ${to || '…'}`} />
              )}
            </div>
          )}
        </section>

        {/* ---------- Results ---------- */}
        {query.isPending ? (
          <SkeletonList />
        ) : query.error ? (
          <div className="flex items-start gap-3 rounded-2xl border border-danger-100 bg-gradient-to-br from-danger-50 to-white p-5 shadow-sm">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-danger-100 text-danger-600">
              <AlertCircle className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold tracking-tight text-danger-800">
                Couldn't load audit events
              </p>
              <p className="mt-0.5 text-[13px] leading-relaxed text-danger-600">
                {query.error.message}
              </p>
            </div>
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={ScrollText}
            title={hasFilters ? 'No matching events' : 'No audit events yet'}
            description={
              hasFilters
                ? 'Try widening your date range or clearing filters.'
                : 'Changes to fees, exams, settings, and roles will appear here.'
            }
          />
        ) : (
          <section className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-sm">
            {/* header strip */}
            <div className="flex items-center justify-between border-b border-ink-100 bg-gradient-to-r from-ink-50/70 to-transparent px-4 py-2.5 sm:px-5">
              <div className="flex items-center gap-2">
                <Activity className="h-3.5 w-3.5 text-ink-400" aria-hidden />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                  Activity
                </span>
              </div>
              {pagination && (
                <span className="text-[11px] font-medium tabular-nums text-ink-500">
                  {pagination.total.toLocaleString()} events
                </span>
              )}
            </div>

            <ul className="divide-y divide-ink-100/80">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="group relative px-4 py-4 transition-colors duration-150 hover:bg-ink-50/40 sm:px-5"
                >
                  {/* hover accent bar */}
                  <span
                    aria-hidden
                    className="absolute inset-y-0 left-0 w-0.5 origin-top scale-y-0 bg-primary-500 transition-transform duration-200 group-hover:scale-y-100"
                  />

                  <div className="flex items-start gap-3 sm:gap-4">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold tracking-wide ring-1 transition-transform duration-200 group-hover:scale-105 ${avatarTone(
                        item.actorName,
                      )}`}
                      aria-hidden
                    >
                      {initials(item.actorName)}
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-[13.5px] font-medium leading-snug tracking-tight text-ink-950">
                        {item.summary}
                      </p>
                      <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[12px] text-ink-500">
                        <span className="font-medium text-ink-700">
                          {item.actorName || 'System'}
                        </span>
                        {item.actorEmail && (
                          <>
                            <Dot />
                            <span className="truncate">{item.actorEmail}</span>
                          </>
                        )}
                        <Dot />
                        <time
                          dateTime={item.createdAt}
                          title={new Date(item.createdAt).toLocaleString()}
                          className="tabular-nums"
                        >
                          {formatRelative(item.createdAt)}
                        </time>
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                      <Badge
                        tone="primary"
                        className="rounded-md px-2 py-0.5 font-mono text-[10.5px] font-medium tracking-tight"
                      >
                        {item.action}
                      </Badge>
                      <Badge
                        tone="neutral"
                        className="rounded-md px-2 py-0.5 text-[10.5px] font-medium capitalize tracking-tight"
                      >
                        {item.entityType.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {pagination && pagination.totalPages > 1 && (
              <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                total={pagination.total}
                limit={30}
                onChange={setPage}
              />
            )}
          </section>
        )}

        {/* Footer note */}
        <div className="flex items-center justify-center gap-1.5 pt-2 text-[11px] text-ink-400">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
          <span>Audit events are immutable and retained per your school's policy.</span>
        </div>
      </div>
    </AppLayout>
  );
}

/* ---------- small components ---------- */

function FilterField({
  id,
  label,
  icon,
  children,
}: {
  id: string;
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-500"
      >
        <span className="text-ink-400">{icon}</span>
        {label}
      </label>
      {children}
    </div>
  );
}

function FilterChip({ label, mono = false }: { label: string; mono?: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-medium text-primary-700 ring-1 ring-inset ring-primary-100 ${
        mono ? 'font-mono' : ''
      }`}
    >
      {label}
    </span>
  );
}

function Dot() {
  return <span aria-hidden className="text-ink-300">·</span>;
}

function SkeletonList() {
  return (
    <section className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-sm">
      <div className="border-b border-ink-100 bg-ink-50/50 px-4 py-2.5 sm:px-5">
        <div className="h-3 w-24 animate-pulse rounded bg-ink-100" />
      </div>
      <ul className="divide-y divide-ink-100/80">
        {Array.from({ length: 6 }).map((_, index) => (
          <li key={index} className="flex items-start gap-4 px-4 py-4 sm:px-5">
            <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-ink-100" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-2/3 animate-pulse rounded bg-ink-100" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-ink-100" />
            </div>
            <div className="hidden gap-1.5 sm:flex">
              <div className="h-5 w-20 animate-pulse rounded-md bg-ink-100" />
              <div className="h-5 w-16 animate-pulse rounded-md bg-ink-100" />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Pagination({
  page,
  totalPages,
  total,
  limit,
  onChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onChange: (page: number) => void;
}) {
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="flex flex-col gap-3 border-t border-ink-100 bg-ink-50/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <p className="text-[12px] tabular-nums text-ink-500">
        Showing <span className="font-semibold text-ink-800">{start}–{end}</span> of{' '}
        <span className="font-semibold text-ink-800">{total.toLocaleString()}</span>
      </p>
      <div className="flex items-center gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onChange(Math.max(1, page - 1))}
          aria-label="Previous page"
          className="transition active:scale-[0.98]"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline">Prev</span>
        </Button>
        <span className="px-2 text-[12px] font-medium tabular-nums text-ink-700">
          {page} / {totalPages}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
          aria-label="Next page"
          className="transition active:scale-[0.98]"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}