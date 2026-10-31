import { useState } from 'react';
import { ScrollText } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { PageLoader } from '@/components/ui/spinner';
import { usePermission } from '@/hooks/usePermission';
import { useAuditLogs } from '../hooks/useAuditLogs';

function monthStart() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    .toISOString()
    .slice(0, 10);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

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

  if (!canView) {
    return (
      <AppLayout>
        <EmptyState
          icon={ScrollText}
          title="No access"
          description="You need audit log permission to view this page."
        />
      </AppLayout>
    );
  }

  const items = query.data?.items ?? [];
  const pagination = query.data?.pagination;

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Administration"
          title="Audit log"
          description="Track who changed fees, exams, settings, and roles."
        />

        <section className="panel grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-ink-800">From</span>
            <input
              type="date"
              className="field-select"
              value={from}
              onChange={(event) => {
                setFrom(event.target.value);
                setPage(1);
              }}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-ink-800">To</span>
            <input
              type="date"
              className="field-select"
              value={to}
              onChange={(event) => {
                setTo(event.target.value);
                setPage(1);
              }}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-ink-800">Action</span>
            <input
              className="field-select"
              placeholder="e.g. fees.payment.record"
              value={action}
              onChange={(event) => {
                setAction(event.target.value.trim());
                setPage(1);
              }}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-ink-800">Entity</span>
            <select
              className="field-select"
              value={entityType}
              onChange={(event) => {
                setEntityType(event.target.value);
                setPage(1);
              }}
            >
              <option value="">All entities</option>
              <option value="fee_structure">Fee structure</option>
              <option value="fee_invoice">Fee invoice</option>
              <option value="fee_payment">Fee payment</option>
              <option value="exam">Exam</option>
              <option value="tenant">School settings</option>
              <option value="role">Role</option>
              <option value="user">User</option>
            </select>
          </label>
        </section>

        {query.isPending ? (
          <div className="panel">
            <PageLoader compact />
          </div>
        ) : query.error ? (
          <div className="rounded-2xl border border-danger-100 bg-danger-50 p-6 text-sm text-danger-700">
            {query.error.message}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={ScrollText}
            title="No audit events"
            description="Changes to fees, exams, settings, and roles will appear here."
          />
        ) : (
          <section className="panel overflow-hidden">
            <ul className="divide-y divide-ink-100">
              {items.map((item) => (
                <li key={item.id} className="px-4 py-4 sm:px-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <p className="font-medium text-ink-950">{item.summary}</p>
                      <p className="text-sm text-ink-500">
                        {item.actorName || 'System'}
                        {item.actorEmail ? ` · ${item.actorEmail}` : ''}
                        {' · '}
                        {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge tone="primary">{item.action}</Badge>
                      <Badge tone="neutral">{item.entityType}</Badge>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-ink-100 px-4 py-3">
                <p className="text-sm text-ink-500">
                  Page {pagination.page} of {pagination.totalPages} · {pagination.total} events
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage((current) => current + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </AppLayout>
  );
}
