import { useState } from 'react';
import { Megaphone, Plus, Send, Trash2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { PageHeader } from '@/components/ui/page-header';
import { PageLoader } from '@/components/ui/spinner';
import { usePermission } from '@/hooks/usePermission';
import {
  useCreateNotice,
  useDeleteNotice,
  useNotices,
  usePublishNotice,
  type Notice,
} from '../hooks/useNotices';
import type { NoticeAudience, NoticeFilters, NoticeStatus } from '../hooks/keys';

export function NoticesListPage() {
  const { can } = usePermission();
  const canSend = can('notices.send');
  const [filters, setFilters] = useState<NoticeFilters>({ page: 1, limit: 20 });
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Notice | null>(null);
  const noticesQuery = useNotices(filters);
  const publishNotice = usePublishNotice();
  const deleteNotice = useDeleteNotice();
  const items = noticesQuery.data?.items ?? [];
  const pagination = noticesQuery.data?.pagination;

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Communication"
          title="Notices"
          description="Create drafts and publish school announcements."
          actions={
            canSend ? (
              <Button onClick={() => setCreating(true)}>
                <Plus className="h-4 w-4" aria-hidden="true" /> New notice
              </Button>
            ) : undefined
          }
        />

        <section className="panel grid grid-cols-1 gap-3 p-4 md:grid-cols-12">
          <div className="md:col-span-6">
            <Input
              type="search"
              aria-label="Search notices"
              placeholder="Search notices..."
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
          <select
            aria-label="Filter by status"
            className="field-select md:col-span-3"
            value={filters.status ?? ''}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                status: (event.target.value || undefined) as NoticeStatus | undefined,
                page: 1,
              }))
            }
          >
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
          <select
            aria-label="Filter by audience"
            className="field-select md:col-span-3"
            value={filters.audience ?? ''}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                audience: (event.target.value || undefined) as NoticeAudience | undefined,
                page: 1,
              }))
            }
          >
            <option value="">All audiences</option>
            <option value="all">Everyone</option>
            <option value="staff">Staff</option>
            <option value="students">Students</option>
            <option value="parents">Parents</option>
          </select>
        </section>

        {noticesQuery.isPending ? (
          <div className="panel">
            <PageLoader compact />
          </div>
        ) : noticesQuery.error ? (
          <section className="panel border-danger-100 p-8 text-center">
            <h2 className="font-display font-semibold text-ink-950">Failed to load notices</h2>
            <p className="mt-2 text-sm text-ink-600">{noticesQuery.error.message}</p>
          </section>
        ) : items.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            title="No notices yet"
            description="Publish your first school announcement."
            action={
              canSend ? (
                <Button onClick={() => setCreating(true)}>
                  <Plus className="h-4 w-4" aria-hidden="true" /> New notice
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="space-y-4">
            {items.map((notice) => (
              <NoticeCard
                key={notice.id}
                notice={notice}
                canSend={canSend}
                onPublish={() => publishNotice.mutate(notice.id)}
                onDelete={() => setDeleting(notice)}
              />
            ))}
          </div>
        )}

        {pagination && pagination.totalPages > 1 && (
          <footer className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink-500">
              Page {pagination.page} of {pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() =>
                  setFilters((current) => ({ ...current, page: (current.page ?? 1) - 1 }))
                }
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() =>
                  setFilters((current) => ({ ...current, page: (current.page ?? 1) + 1 }))
                }
              >
                Next
              </Button>
            </div>
          </footer>
        )}
      </div>

      {creating && <CreateNoticeModal onClose={() => setCreating(false)} />}

      <ConfirmDialog
        open={deleting !== null}
        title="Delete notice"
        description={deleting ? `Delete notice "${deleting.title}"?` : ''}
        confirmLabel="Delete"
        loading={deleteNotice.isPending}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return;
          deleteNotice.mutate(deleting.id, { onSettled: () => setDeleting(null) });
        }}
      />
    </AppLayout>
  );
}

function NoticeCard({
  notice,
  canSend,
  onPublish,
  onDelete,
}: {
  notice: Notice;
  canSend: boolean;
  onPublish: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="panel p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap gap-2">
            <Badge tone={notice.status === 'published' ? 'success' : 'warning'}>
              {notice.status}
            </Badge>
            <Badge tone="primary">{notice.audience}</Badge>
          </div>
          <h2 className="font-display text-lg font-semibold text-ink-950">{notice.title}</h2>
          <p className="mt-2 whitespace-pre-wrap break-words text-sm text-ink-700">{notice.body}</p>
          <p className="mt-3 text-xs text-ink-400">
            {notice.createdByName ? `By ${notice.createdByName} · ` : ''}
            {notice.publishedAt
              ? `Published ${new Date(notice.publishedAt).toLocaleString()}`
              : `Created ${new Date(notice.createdAt).toLocaleString()}`}
          </p>
        </div>
        {canSend && (
          <div className="flex gap-2">
            {notice.status === 'draft' && (
              <Button type="button" size="sm" onClick={onPublish}>
                <Send className="h-4 w-4" aria-hidden="true" /> Publish
              </Button>
            )}
            <Button type="button" size="sm" variant="ghost" onClick={onDelete} aria-label="Delete">
              <Trash2 className="h-4 w-4 text-danger-600" aria-hidden="true" />
            </Button>
          </div>
        )}
      </div>
    </article>
  );
}

function CreateNoticeModal({ onClose }: { onClose: () => void }) {
  const createNotice = useCreateNotice();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState<NoticeAudience>('all');
  const [publish, setPublish] = useState(false);

  const submit = (asPublish: boolean) => {
    if (title.trim().length < 3 || !body.trim()) return;
    createNotice.mutate(
      { title: title.trim(), body: body.trim(), audience, publish: asPublish },
      { onSuccess: onClose },
    );
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="New notice"
      description="Write a draft or publish immediately."
      size="lg"
      closeDisabled={createNotice.isPending}
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={createNotice.isPending}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => submit(false)}
            isLoading={createNotice.isPending && !publish}
            disabled={createNotice.isPending}
          >
            Save draft
          </Button>
          <Button
            type="button"
            onClick={() => {
              setPublish(true);
              submit(true);
            }}
            isLoading={createNotice.isPending && publish}
            disabled={createNotice.isPending}
          >
            Publish
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input label="Title *" value={title} onChange={(event) => setTitle(event.target.value)} />
        <div>
          <label htmlFor="notice-body" className="mb-1.5 block text-sm font-medium text-ink-800">
            Message *
          </label>
          <textarea
            id="notice-body"
            rows={6}
            className="field-select"
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="notice-audience" className="mb-1.5 block text-sm font-medium text-ink-800">
            Audience
          </label>
          <select
            id="notice-audience"
            className="field-select"
            value={audience}
            onChange={(event) => setAudience(event.target.value as NoticeAudience)}
          >
            <option value="all">Everyone</option>
            <option value="staff">Staff</option>
            <option value="students">Students</option>
            <option value="parents">Parents</option>
          </select>
        </div>
      </div>
    </Modal>
  );
}
