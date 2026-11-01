import { useMemo, useState } from 'react';
import {
  LifeBuoy,
  Plus,
  Search,
  CircleDot,
  Clock,
  CheckCircle2,
  Inbox,
  ChevronRight,
  AlertCircle,
  MessageSquare,
  Sparkles,
  Building2,
  User as UserIcon,
  Flag,
  Tag,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { FilterField, FiltersPanel } from '@/components/ui/filters-panel';
import { Input } from '@/components/ui/input';
import { ListPagination } from '@/components/ui/list-pagination';
import { MetricCard, MetricGrid } from '@/components/ui/metric-card';
import { Modal } from '@/components/ui/modal';
import { PageShell } from '@/components/ui/page-shell';
import { usePermission } from '@/hooks/usePermission';
import { hasActiveFilters, resetListFilters } from '@/lib/list-filters';
import {
  formatCategory,
  formatPriority,
  formatStatus,
  priorityTone,
  statusTone,
} from '../components/supportLabels';
import {
  useCreateSupportTicket,
  useSupportTickets,
  type SupportTicket,
} from '../hooks/useSupport';
import type {
  SupportCategory,
  SupportPriority,
  SupportStatus,
  SupportTicketFilters,
} from '../hooks/keys';

type Scope = 'school' | 'platform';

const tabularNums: React.CSSProperties = { fontVariantNumeric: 'tabular-nums' };

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

const statusAccent: Record<SupportStatus, string> = {
  open: 'bg-primary-500',
  in_progress: 'bg-amber-500',
  waiting_school: 'bg-sky-500',
  resolved: 'bg-emerald-500',
  closed: 'bg-ink-400',
};

export function SupportTicketsPage({ scope }: { scope: Scope }) {
  const { can } = usePermission();
  const canCreate = scope === 'school' && can('support.create');
  const [filters, setFilters] = useState<SupportTicketFilters>({
    page: 1,
    limit: 20,
  });
  const [creating, setCreating] = useState(false);
  const ticketsQuery = useSupportTickets(scope, filters);
  const items = ticketsQuery.data?.items ?? [];
  const pagination = ticketsQuery.data?.pagination;

  const totals = useMemo(() => {
    let open = 0;
    let inProgress = 0;
    let resolved = 0;
    for (const t of items) {
      if (t.status === 'open') open += 1;
      else if (t.status === 'in_progress' || t.status === 'waiting_school')
        inProgress += 1;
      else if (t.status === 'resolved' || t.status === 'closed') resolved += 1;
    }
    return { open, inProgress, resolved, total: items.length };
  }, [items]);

  const filtersActive = hasActiveFilters(filters);

  return (
    <AppLayout>
      <style>{`
        @keyframes panel-in {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        [data-ticket-list] > li { animation: panel-in 200ms ease-out both; }
        [data-ticket-list] > li:nth-child(2)  { animation-delay: 20ms; }
        [data-ticket-list] > li:nth-child(3)  { animation-delay: 40ms; }
        [data-ticket-list] > li:nth-child(4)  { animation-delay: 60ms; }
        [data-ticket-list] > li:nth-child(5)  { animation-delay: 80ms; }
      `}</style>

      <PageShell
        eyebrow={scope === 'platform' ? 'Platform' : 'Help'}
        title={scope === 'platform' ? 'Support inbox' : 'Support'}
        description={
          scope === 'platform'
            ? 'Review and reply to school support requests.'
            : 'Contact platform support about billing, access, or technical issues.'
        }
        actions={
          canCreate ? (
            <Button
              onClick={() => setCreating(true)}
              className="transition active:scale-[0.98]"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" aria-hidden />
              New ticket
            </Button>
          ) : undefined
        }
        footerNote={
          <>
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            <span>All replies appear in-thread and notify the other side.</span>
          </>
        }
      >
        <MetricGrid>
          <MetricCard
            icon={<Inbox className="h-4 w-4" aria-hidden />}
            label="Open"
            value={totals.open}
            tone="primary"
          />
          <MetricCard
            icon={<Clock className="h-4 w-4" aria-hidden />}
            label="In progress"
            value={totals.inProgress}
            tone="warning"
          />
          <MetricCard
            icon={<CheckCircle2 className="h-4 w-4" aria-hidden />}
            label="Resolved"
            value={totals.resolved}
            tone="success"
          />
          <MetricCard
            icon={<MessageSquare className="h-4 w-4" aria-hidden />}
            label="Shown"
            value={totals.total}
            tone="neutral"
          />
        </MetricGrid>

        <FiltersPanel
          description="Find tickets by status, category, or priority."
          pageLimit={filters.limit ?? 20}
          onPageLimitChange={(limit) =>
            setFilters((current) => ({ ...current, limit, page: 1 }))
          }
          onClear={() => setFilters((current) => resetListFilters(current))}
          clearDisabled={!filtersActive}
        >
          <FilterField
            id="support-search"
            label="Search"
            icon={<Search className="h-3.5 w-3.5 text-ink-400" aria-hidden />}
            className="md:col-span-5"
          >
            <Input
              id="support-search"
              type="search"
              aria-label="Search tickets"
              placeholder={
                scope === 'platform'
                  ? 'Search subject or school...'
                  : 'Search tickets...'
              }
              value={filters.search ?? ''}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  search: event.target.value || undefined,
                  page: 1,
                }))
              }
            />
          </FilterField>

          <FilterField
            id="support-status"
            label="Status"
            icon={<CircleDot className="h-3.5 w-3.5 text-ink-400" aria-hidden />}
            className="md:col-span-2"
          >
            <select
              id="support-status"
              aria-label="Filter by status"
              className="field-select w-full text-[13px]"
              value={filters.status ?? ''}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  status: (event.target.value || undefined) as
                    | SupportStatus
                    | undefined,
                  page: 1,
                }))
              }
            >
              <option value="">All</option>
              <option value="open">Open</option>
              <option value="in_progress">In progress</option>
              <option value="waiting_school">Waiting on school</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </FilterField>

          <FilterField
            id="support-category-filter"
            label="Category"
            icon={<Tag className="h-3.5 w-3.5 text-ink-400" aria-hidden />}
            className="md:col-span-3"
          >
            <select
              id="support-category-filter"
              aria-label="Filter by category"
              className="field-select w-full text-[13px]"
              value={filters.category ?? ''}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  category: (event.target.value || undefined) as
                    | SupportCategory
                    | undefined,
                  page: 1,
                }))
              }
            >
              <option value="">All</option>
              <option value="billing">Billing</option>
              <option value="technical">Technical</option>
              <option value="account">Account</option>
              <option value="feature">Feature request</option>
              <option value="other">Other</option>
            </select>
          </FilterField>

          <FilterField
            id="support-priority-filter"
            label="Priority"
            icon={<Flag className="h-3.5 w-3.5 text-ink-400" aria-hidden />}
            className="md:col-span-2"
          >
            <select
              id="support-priority-filter"
              aria-label="Filter by priority"
              className="field-select w-full text-[13px]"
              value={filters.priority ?? ''}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  priority: (event.target.value || undefined) as
                    | SupportPriority
                    | undefined,
                  page: 1,
                }))
              }
            >
              <option value="">All</option>
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
            </select>
          </FilterField>
        </FiltersPanel>

        {/* ---------- Results ---------- */}
        {ticketsQuery.isPending ? (
          <SkeletonList />
        ) : ticketsQuery.error ? (
          <div className="flex items-start gap-3 rounded-2xl bg-gradient-to-br from-danger-50 to-white p-5 shadow-sm ring-1 ring-danger-100">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-danger-100 text-danger-600">
              <AlertCircle className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold tracking-tight text-danger-800">
                Failed to load tickets
              </p>
              <p className="mt-0.5 text-[13px] leading-relaxed text-danger-600">
                {ticketsQuery.error.message}
              </p>
            </div>
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={LifeBuoy}
            title="No support tickets"
            description={
              scope === 'platform'
                ? 'School tickets will appear here when submitted.'
                : 'Open a ticket when you need help from the platform team.'
            }
            action={
              canCreate ? (
                <Button onClick={() => setCreating(true)}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                  New ticket
                </Button>
              ) : undefined
            }
          />
        ) : (
          <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-ink-100">
            <ul data-ticket-list className="divide-y divide-ink-100">
              {items.map((ticket) => (
                <TicketRow
                  key={ticket.id}
                  ticket={ticket}
                  showSchool={scope === 'platform'}
                />
              ))}
            </ul>
          </section>
        )}

        {pagination ? (
          <ListPagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            limit={pagination.limit}
            onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
          />
        ) : null}
      </PageShell>

      {creating && <CreateTicketModal onClose={() => setCreating(false)} />}
    </AppLayout>
  );
}

/* ---------- sub-components ---------- */

function TicketRow({
  ticket,
  showSchool,
}: {
  ticket: SupportTicket;
  showSchool: boolean;
}) {
  return (
    <li>
      <Link
        to={`/support/${ticket.id}`}
        className="group relative block px-4 py-4 transition-colors hover:bg-ink-50/50 sm:px-5"
      >
        <span
          aria-hidden
          className={`absolute inset-y-0 left-0 w-0.5 ${
            statusAccent[ticket.status as SupportStatus] ?? 'bg-ink-400'
          }`}
        />
        <div className="flex items-start justify-between gap-3 pl-3">
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
              <Badge
                tone={statusTone(ticket.status)}
                className="rounded-md px-2 py-0.5 text-[10.5px] font-medium capitalize tracking-tight"
              >
                {formatStatus(ticket.status)}
              </Badge>
              <Badge
                tone={priorityTone(ticket.priority)}
                className="rounded-md px-2 py-0.5 text-[10.5px] font-medium capitalize tracking-tight"
              >
                {formatPriority(ticket.priority)}
              </Badge>
              <Badge
                tone="neutral"
                className="rounded-md px-2 py-0.5 text-[10.5px] font-medium tracking-tight"
              >
                {formatCategory(ticket.category)}
              </Badge>
            </div>

            <p className="truncate font-display text-[14.5px] font-semibold tracking-tight text-ink-950">
              {ticket.subject}
            </p>

            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11.5px] text-ink-500">
              {showSchool && ticket.tenantName && (
                <span className="inline-flex items-center gap-1">
                  <Building2 className="h-3 w-3 text-ink-400" aria-hidden />
                  {ticket.tenantName}
                </span>
              )}
              {showSchool && ticket.tenantName && ticket.createdByName && (
                <span aria-hidden className="text-ink-300">·</span>
              )}
              {ticket.createdByName && (
                <span className="inline-flex items-center gap-1">
                  <UserIcon className="h-3 w-3 text-ink-400" aria-hidden />
                  Opened by {ticket.createdByName}
                </span>
              )}
              <span aria-hidden className="text-ink-300">·</span>
              <span
                className="inline-flex items-center gap-1"
                title={new Date(ticket.lastMessageAt).toLocaleString()}
                style={tabularNums}
              >
                <Clock className="h-3 w-3 text-ink-400" aria-hidden />
                Updated {relativeTime(ticket.lastMessageAt)}
              </span>
            </div>
          </div>

          <span className="flex shrink-0 items-center gap-1 text-[12px] font-medium text-primary-700 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            Open
            <ChevronRight
              className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </span>
        </div>
      </Link>
    </li>
  );
}

function SkeletonList() {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-ink-100">
      <ul className="divide-y divide-ink-100">
        {Array.from({ length: 5 }).map((_, index) => (
          <li key={index} className="px-4 py-4 sm:px-5">
            <div className="flex items-start gap-3 pl-3">
              <div className="flex-1 space-y-2">
                <div className="flex gap-1.5">
                  <div className="h-4 w-14 animate-pulse rounded bg-ink-100" />
                  <div className="h-4 w-16 animate-pulse rounded bg-ink-100" />
                  <div className="h-4 w-20 animate-pulse rounded bg-ink-100" />
                </div>
                <div className="h-4 w-2/3 animate-pulse rounded bg-ink-100" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-ink-100" />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- modal ---------- */

function CreateTicketModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const createTicket = useCreateSupportTicket();
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<SupportCategory>('other');
  const [priority, setPriority] = useState<SupportPriority>('normal');

  const canSubmit =
    subject.trim().length >= 3 && body.trim().length > 0 && !createTicket.isPending;

  const submit = () => {
    if (!canSubmit) return;
    createTicket.mutate(
      {
        subject: subject.trim(),
        body: body.trim(),
        category,
        priority,
      },
      {
        onSuccess: (detail) => {
          onClose();
          navigate(`/support/${detail.ticket.id}`);
        },
      },
    );
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="New support ticket"
      description="Describe the issue. The platform team will reply in this thread."
      size="lg"
      closeDisabled={createTicket.isPending}
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={createTicket.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={submit}
            isLoading={createTicket.isPending}
            disabled={!canSubmit}
          >
            Submit ticket
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* What */}
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-700 ring-1 ring-primary-100">
              <LifeBuoy className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <h3 className="font-display text-[13.5px] font-semibold tracking-tight text-ink-950">
                What's happening?
              </h3>
              <p className="mt-0.5 text-[11.5px] leading-relaxed text-ink-500">
                A short subject and description helps us route it to the right
                person.
              </p>
            </div>
          </div>

          <Input
            label="Subject *"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            placeholder="Short summary of the issue"
          />

          <div>
            <label
              htmlFor="support-body"
              className="mb-1.5 block text-[12px] font-medium text-ink-800"
            >
              Message <span className="text-danger-500">*</span>
            </label>
            <textarea
              id="support-body"
              rows={6}
              className="field-select min-h-[140px] w-full resize-y text-[13px] leading-relaxed"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Include what you tried and any error messages."
            />
            <p className="mt-1 text-[11px] text-ink-400">
              Tip: screenshots and exact error text speed things up.
            </p>
          </div>
        </div>

        {/* Classify */}
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-700 ring-1 ring-primary-100">
              <Tag className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <h3 className="font-display text-[13.5px] font-semibold tracking-tight text-ink-950">
                Classify the request
              </h3>
              <p className="mt-0.5 text-[11.5px] leading-relaxed text-ink-500">
                Category helps routing. Priority sets the response SLA.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="support-category"
                className="mb-1.5 block text-[12px] font-medium text-ink-800"
              >
                Category
              </label>
              <select
                id="support-category"
                className="field-select w-full text-[13px]"
                value={category}
                onChange={(event) =>
                  setCategory(event.target.value as SupportCategory)
                }
              >
                <option value="billing">Billing</option>
                <option value="technical">Technical</option>
                <option value="account">Account</option>
                <option value="feature">Feature request</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="support-priority"
                className="mb-1.5 block text-[12px] font-medium text-ink-800"
              >
                Priority
              </label>
              <select
                id="support-priority"
                className="field-select w-full text-[13px]"
                value={priority}
                onChange={(event) =>
                  setPriority(event.target.value as SupportPriority)
                }
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-ink-400">
          You'll be taken to the thread after submission to add follow-ups.
        </p>
      </div>
    </Modal>
  );
}