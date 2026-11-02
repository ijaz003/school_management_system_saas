import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Send,
  ShieldCheck,
  User as UserIcon,
  Lock,
  Clock,
  CheckCircle2,
  RotateCcw,
  MessageSquare,
  AlertCircle,
  Sparkles,
  CornerDownLeft,
  Building2,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { usePermission } from '@/hooks/usePermission';
import { useTenantDateTime } from '@/hooks/useTenantDateTime';
import {
  formatCategory,
  formatPriority,
  formatStatus,
  priorityTone,
  statusTone,
} from '../components/supportLabels';
import {
  useAddSupportMessage,
  useSupportTicket,
  useUpdateSupportTicket,
  type SupportMessage,
} from '../hooks/useSupport';
import type { SupportStatus } from '../hooks/keys';

type Scope = 'school' | 'platform';

const tabularNums: React.CSSProperties = { fontVariantNumeric: 'tabular-nums' };

function relativeTime(iso: string, formatDate: (value: string) => string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return formatDate(iso);
}

function initials(name?: string | null) {
  if (!name) return '?';
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function SupportTicketDetailPage({ scope }: { scope: Scope }) {
  const { id } = useParams<{ id: string }>();
  const { can } = usePermission();
  const { formatDate, formatDateTime } = useTenantDateTime();
  const canReply =
    scope === 'platform' || (scope === 'school' && can('support.create'));
  const detailQuery = useSupportTicket(scope, id);
  const updateTicket = useUpdateSupportTicket(scope);
  const addMessage = useAddSupportMessage(scope);
  const [reply, setReply] = useState('');
  const [internalNote, setInternalNote] = useState(false);
  const threadEndRef = useRef<HTMLDivElement>(null);
  const threadTopRef = useRef<HTMLElement>(null);

  const ticket = detailQuery.data?.ticket;
  const messages = detailQuery.data?.messages ?? [];

  const initialScrollDone = useRef(false);
  useEffect(() => {
    if (initialScrollDone.current || messages.length === 0) return;
    threadEndRef.current?.scrollIntoView({ block: 'end' });
    initialScrollDone.current = true;
  }, [messages.length]);

  const sendReply = () => {
    if (!id || !reply.trim() || addMessage.isPending) return;
    addMessage.mutate(
      {
        id,
        body: reply.trim(),
        isInternal: scope === 'platform' ? internalNote : false,
      },
      {
        onSuccess: () => {
          setReply('');
          setInternalNote(false);
        },
      },
    );
  };

  const onComposerKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      sendReply();
    }
  };

  const threadMeta = useMemo(() => {
    if (!ticket) return null;
    return {
      opened: formatDateTime(ticket.createdAt),
      lastActivity: formatDateTime(ticket.lastMessageAt),
    };
  }, [ticket, formatDateTime]);

  return (
    <AppLayout>
      {/* embedded keyframe utilities — no external CSS needed */}
      <style>{`
        @keyframes msg-in {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        [data-msg] { animation: msg-in 200ms ease-out both; }
      `}</style>

      <div className="mx-auto max-w-4xl space-y-5 pb-12">
        {/* ---------- Back ---------- */}
        <Link
          to="/support"
          className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[12.5px] font-medium text-ink-500 transition hover:bg-ink-50 hover:text-ink-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Back to support
        </Link>

        {/* ---------- Loading ---------- */}
        {detailQuery.isPending ? (
          <LoadingSkeleton />
        ) : detailQuery.error || !ticket || !threadMeta ? (
          <div className="flex items-start gap-3 rounded-2xl bg-gradient-to-br from-danger-50 to-white p-5 shadow-sm ring-1 ring-danger-100">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-danger-100 text-danger-600">
              <AlertCircle className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold tracking-tight text-danger-800">
                Ticket not found
              </p>
              <p className="mt-0.5 text-[13px] leading-relaxed text-danger-600">
                {detailQuery.error?.message ??
                  'This ticket may have been removed.'}
              </p>
              <Link
                to="/support"
                className="mt-3 inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1 text-[12px] font-medium text-ink-700 shadow-sm ring-1 ring-ink-100 transition hover:bg-ink-50"
              >
                <ArrowLeft className="h-3 w-3" aria-hidden />
                Back to list
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* ---------- Header ---------- */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white via-white to-ink-50/60 px-5 py-5 shadow-sm ring-1 ring-ink-100 sm:px-6 sm:py-6">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary-100/40 blur-3xl"
              />
              <div className="relative">
                <PageHeader
                  eyebrow={
                    scope === 'platform'
                      ? ticket.tenantName ?? 'School'
                      : 'Ticket'
                  }
                  title={ticket.subject}
                  description={`Opened ${threadMeta.opened}${
                    ticket.createdByName ? ` by ${ticket.createdByName}` : ''
                  }`}
                />
              </div>
            </div>

            {/* ---------- Status bar ---------- */}
            <div className="flex flex-wrap items-center gap-1.5 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-ink-100">
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

              {scope === 'platform' && ticket.tenantSlug && (
                <span className="ml-1 inline-flex items-center gap-1 text-[11px] text-ink-500">
                  <Building2 className="h-3 w-3 text-ink-400" aria-hidden />
                  /{ticket.tenantSlug}
                </span>
              )}

              <span className="ml-auto flex items-center gap-1 text-[11px] text-ink-400">
                <Clock className="h-3 w-3" aria-hidden />
                <span style={tabularNums}>
                  Updated {relativeTime(ticket.lastMessageAt, formatDate)}
                </span>
              </span>
            </div>

            {/* ---------- Platform info panel ---------- */}
            {scope === 'platform' && (
              <div className="grid grid-cols-1 gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-ink-100 sm:grid-cols-3">
                <div>
                  <label
                    htmlFor="ticket-status"
                    className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-500"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-ink-400" aria-hidden />
                    Status
                  </label>
                  <select
                    id="ticket-status"
                    className="field-select w-full text-[13px]"
                    value={ticket.status}
                    disabled={updateTicket.isPending}
                    onChange={(event) =>
                      updateTicket.mutate({
                        id: ticket.id,
                        status: event.target.value as SupportStatus,
                      })
                    }
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In progress</option>
                    <option value="waiting_school">Waiting on school</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                    Details
                  </p>
                  <div className="space-y-1 text-[12.5px] text-ink-600">
                    <p className="flex items-center gap-1.5" style={tabularNums}>
                      <Clock className="h-3.5 w-3.5 text-ink-400" aria-hidden />
                      Last activity{' '}
                      <span className="text-ink-900">
                        {threadMeta.lastActivity}
                      </span>
                    </p>
                    {ticket.assignedToName && (
                      <p className="flex items-center gap-1.5">
                        <UserIcon
                          className="h-3.5 w-3.5 text-ink-400"
                          aria-hidden
                        />
                        Assigned to{' '}
                        <span className="text-ink-900">
                          {ticket.assignedToName}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ---------- School quick actions ---------- */}
            {scope === 'school' && canReply && ticket.status !== 'closed' && (
              <div className="flex flex-wrap gap-2 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-ink-100">
                {ticket.status !== 'resolved' ? (
                  <Button
                    size="sm"
                    variant="outline"
                    isLoading={updateTicket.isPending}
                    onClick={() =>
                      updateTicket.mutate({ id: ticket.id, status: 'resolved' })
                    }
                    className="transition active:scale-[0.98]"
                  >
                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                    Mark resolved
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    isLoading={updateTicket.isPending}
                    onClick={() =>
                      updateTicket.mutate({ id: ticket.id, status: 'open' })
                    }
                    className="transition active:scale-[0.98]"
                  >
                    <RotateCcw className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                    Reopen
                  </Button>
                )}
                <p className="ml-auto flex items-center gap-1 self-center text-[11px] text-ink-400">
                  <Sparkles className="h-3 w-3" aria-hidden />
                  Resolving helps us close the loop faster.
                </p>
              </div>
            )}

            {/* ---------- Thread ---------- */}
            <section
              ref={threadTopRef}
              aria-live="polite"
              aria-relevant="additions"
              className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-ink-100"
            >
              <div className="flex items-center justify-between gap-3 border-b border-ink-100 bg-gradient-to-r from-ink-50/60 to-transparent px-4 py-2.5 sm:px-5">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-primary-700 ring-1 ring-ink-100">
                    <MessageSquare className="h-3.5 w-3.5" aria-hidden />
                  </span>
                  <div>
                    <p className="text-[12px] font-semibold tracking-tight text-ink-900">
                      Conversation
                    </p>
                    <p
                      className="text-[10.5px] text-ink-500"
                      style={tabularNums}
                    >
                      {messages.length}{' '}
                      {messages.length === 1 ? 'message' : 'messages'}
                    </p>
                  </div>
                </div>
                {scope === 'platform' && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 text-[10.5px] font-medium text-ink-600 ring-1 ring-ink-100">
                    <Lock className="h-2.5 w-2.5" aria-hidden />
                    Notes hidden from school
                  </span>
                )}
              </div>

              {messages.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-50 text-ink-400 ring-1 ring-ink-100">
                    <MessageSquare className="h-4 w-4" aria-hidden />
                  </span>
                  <p className="text-[12.5px] font-medium text-ink-700">
                    No messages yet
                  </p>
                  <p className="text-[11.5px] text-ink-500">
                    Write the first reply below.
                  </p>
                </div>
              ) : (
                <ol
                  role="log"
                  className="space-y-3 px-4 py-4 sm:px-5"
                >
                  {messages.map((message) => (
                    <MessageBubble key={message.id} message={message} />
                  ))}
                </ol>
              )}

              {/* ---------- Composer ---------- */}
              {canReply && ticket.status !== 'closed' ? (
                <div className="border-t border-ink-100 bg-ink-50/40 p-4 sm:p-5">
                  <label
                    htmlFor="support-reply"
                    className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-500"
                  >
                    <CornerDownLeft
                      className="h-3.5 w-3.5 text-ink-400"
                      aria-hidden
                    />
                    {scope === 'platform' && internalNote
                      ? 'Internal note'
                      : 'Reply'}
                  </label>

                  <div className="rounded-xl bg-white shadow-sm ring-1 ring-ink-100 transition focus-within:ring-primary-200 focus-within:ring-2">
                    <textarea
                      id="support-reply"
                      rows={4}
                      className="block w-full resize-y rounded-xl border-0 bg-transparent px-3 py-2.5 text-[13px] leading-relaxed text-ink-900 outline-none placeholder:text-ink-400"
                      value={reply}
                      onChange={(event) => setReply(event.target.value)}
                      onKeyDown={onComposerKeyDown}
                      placeholder={
                        scope === 'platform' && internalNote
                          ? 'Write a note only your team will see...'
                          : 'Write your message...'
                      }
                    />
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-ink-100 px-2 py-1.5">
                      <div className="flex items-center gap-2">
                        {scope === 'platform' && (
                          <label className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-0.5 text-[11.5px] font-medium text-ink-600 transition hover:bg-ink-50">
                            <button
                              type="button"
                              role="switch"
                              aria-checked={internalNote}
                              aria-label="Mark as internal note"
                              onClick={() => setInternalNote((v) => !v)}
                              className={`relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors ${
                                internalNote ? 'bg-amber-500' : 'bg-ink-300'
                              }`}
                            >
                              <span
                                className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition-transform ${
                                  internalNote
                                    ? 'translate-x-3.5'
                                    : 'translate-x-0.5'
                                }`}
                              />
                            </button>
                            <span className="inline-flex items-center gap-1">
                              <Lock className="h-3 w-3" aria-hidden />
                              Internal
                            </span>
                          </label>
                        )}
                        <span className="text-[11px] text-ink-400">
                          {reply.length > 0 && (
                            <span style={tabularNums}>{reply.length} chars</span>
                          )}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="hidden items-center gap-1 text-[10.5px] text-ink-400 sm:inline-flex">
                          <kbd className="rounded border border-ink-200 bg-white px-1 py-0.5 font-sans text-[10px] text-ink-600">
                            ⌘
                          </kbd>
                          <kbd className="rounded border border-ink-200 bg-white px-1 py-0.5 font-sans text-[10px] text-ink-600">
                            ↵
                          </kbd>
                          to send
                        </span>
                        <Button
                          type="button"
                          onClick={sendReply}
                          isLoading={addMessage.isPending}
                          disabled={!reply.trim()}
                          className="transition active:scale-[0.98]"
                        >
                          <Send className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                          Send
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : ticket.status === 'closed' ? (
                <div className="flex items-center gap-2 border-t border-ink-100 bg-ink-50/50 px-4 py-3 text-[12px] text-ink-500 sm:px-5">
                  <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  This ticket is closed and cannot receive replies.
                </div>
              ) : null}
            </section>

            <div ref={threadEndRef} />
          </>
        )}
      </div>
    </AppLayout>
  );
}

/* ---------- message bubble ---------- */

function MessageBubble({ message }: { message: SupportMessage }) {
  const { formatDate, formatDateTime } = useTenantDateTime();
  const isPlatform = message.authorRole === 'super_admin';
  const isInternal = message.isInternal;

  const tone = isInternal
    ? {
        bubble: 'bg-amber-50 ring-amber-100',
        rail: 'bg-amber-400',
        avatar: 'bg-amber-100 text-amber-700 ring-amber-200',
        name: 'text-amber-900',
        chip: 'Internal note',
      }
    : isPlatform
      ? {
          bubble: 'bg-primary-50/60 ring-primary-100',
          rail: 'bg-primary-400',
          avatar: 'bg-primary-100 text-primary-700 ring-primary-200',
          name: 'text-ink-950',
          chip: isPlatform ? 'Platform' : '',
        }
      : {
          bubble: 'bg-white ring-ink-100',
          rail: 'bg-ink-300',
          avatar: 'bg-ink-100 text-ink-700 ring-ink-200',
          name: 'text-ink-950',
          chip: '',
        };

  const Icon = isInternal ? Lock : isPlatform ? ShieldCheck : UserIcon;
  const authorLabel = message.authorName ?? 'Unknown';

  return (
    <li data-msg className="group">
      <article
        className={`relative overflow-hidden rounded-2xl p-3.5 ring-1 ring-inset transition-shadow ${tone.bubble}`}
      >
        <span
          aria-hidden
          className={`absolute inset-y-0 left-0 w-0.5 ${tone.rail}`}
        />
        <div className="flex items-start gap-3 pl-2">
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10.5px] font-semibold ring-1 ${tone.avatar}`}
            aria-hidden
          >
            {isPlatform || isInternal ? (
              <Icon className="h-3.5 w-3.5" />
            ) : (
              initials(authorLabel)
            )}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <p
                className={`text-[12.5px] font-semibold tracking-tight ${tone.name}`}
              >
                {authorLabel}
              </p>
              {isPlatform && (
                <span className="inline-flex items-center gap-1 rounded-md bg-white/70 px-1.5 py-0.5 text-[10px] font-medium text-primary-700 ring-1 ring-primary-100">
                  <ShieldCheck className="h-2.5 w-2.5" aria-hidden />
                  Platform
                </span>
              )}
              {isInternal && (
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 ring-1 ring-amber-200">
                  <Lock className="h-2.5 w-2.5" aria-hidden />
                  Internal
                </span>
              )}
              <span
                className="ml-auto text-[10.5px] text-ink-400"
                title={formatDateTime(message.createdAt)}
                style={tabularNums}
              >
                {relativeTime(message.createdAt, formatDate)}
              </span>
            </div>

            <p className="mt-1 whitespace-pre-wrap break-words text-[13px] leading-relaxed text-ink-800">
              {message.body}
            </p>
          </div>
        </div>
      </article>
    </li>
  );
}

/* ---------- skeleton ---------- */

function LoadingSkeleton() {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ink-100">
        <div className="space-y-2">
          <div className="h-3 w-24 animate-pulse rounded bg-ink-100" />
          <div className="h-5 w-2/3 animate-pulse rounded bg-ink-100" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-ink-100" />
        </div>
      </div>
      <div className="h-10 animate-pulse rounded-2xl bg-white shadow-sm ring-1 ring-ink-100" />
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-ink-100">
        <div className="border-b border-ink-100 px-4 py-3">
          <div className="h-3 w-24 animate-pulse rounded bg-ink-100" />
        </div>
        <div className="space-y-3 p-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-2xl bg-ink-50/60 p-3.5 ring-1 ring-ink-100">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-ink-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-2.5 w-28 animate-pulse rounded bg-ink-100" />
                  <div className="h-3 w-full animate-pulse rounded bg-ink-100" />
                  <div className="h-3 w-4/5 animate-pulse rounded bg-ink-100" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-ink-100 p-4">
          <div className="h-24 animate-pulse rounded-xl bg-ink-100" />
        </div>
      </div>
    </div>
  );
}