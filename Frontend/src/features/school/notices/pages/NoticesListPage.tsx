import { useState } from 'react';
import { Megaphone, Plus, Search, Send } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RowActions } from '@/components/ui/row-actions';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { FilterField, FiltersPanel } from '@/components/ui/filters-panel';
import { Input } from '@/components/ui/input';
import { ListPagination } from '@/components/ui/list-pagination';
import { Modal } from '@/components/ui/modal';
import { PageShell } from '@/components/ui/page-shell';
import { PageLoader } from '@/components/ui/spinner';
import { usePermission } from '@/hooks/usePermission';
import { hasActiveFilters, resetListFilters } from '@/lib/list-filters';
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
  const [previewing, setPreviewing] = useState<Notice | null>(null);
  const [deleting, setDeleting] = useState<Notice | null>(null);
  const noticesQuery = useNotices(filters);
  const publishNotice = usePublishNotice();
  const deleteNotice = useDeleteNotice();
  const items = noticesQuery.data?.items ?? [];
  const pagination = noticesQuery.data?.pagination;

  return (
    <AppLayout>
      <PageShell
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
      >

        <FiltersPanel
          description="Find notices by keyword, status, or audience."
          pageLimit={filters.limit ?? 20}
          onPageLimitChange={(limit) => setFilters((current) => ({ ...current, limit, page: 1 }))}
          onClear={() => setFilters((current) => resetListFilters(current))}
          clearDisabled={!hasActiveFilters(filters)}
        >
          <FilterField
            id="notice-search"
            label="Search"
            icon={<Search className="h-3.5 w-3.5 text-ink-400" aria-hidden="true" />}
            className="md:col-span-6"
          >
            <Input
              id="notice-search"
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
          </FilterField>
          <FilterField id="notice-status-filter" label="Status" className="md:col-span-3">
            <select
              id="notice-status-filter"
              aria-label="Filter by status"
              className="field-select"
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
          </FilterField>
          <FilterField id="notice-audience-filter" label="Audience" className="md:col-span-3">
            <select
              id="notice-audience-filter"
              aria-label="Filter by audience"
              className="field-select"
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
          </FilterField>
        </FiltersPanel>

        {noticesQuery.isPending ? (
          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-ink-100">
            <PageLoader compact />
          </div>
        ) : noticesQuery.error ? (
          <section className="rounded-2xl border border-danger-100 bg-white p-8 text-center shadow-sm">
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
                onPreview={() => setPreviewing(notice)}
              />
            ))}
          </div>
        )}

        {pagination && (
          <ListPagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            limit={pagination.limit}
            onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
          />
        )}
      </PageShell>

      {creating && <CreateNoticeModal onClose={() => setCreating(false)} />}

      {previewing ? (
        <Modal
          open
          onClose={() => setPreviewing(null)}
          title={previewing.title}
          description="Notice preview"
          footer={
            <Button type="button" variant="outline" onClick={() => setPreviewing(null)}>
              Close
            </Button>
          }
        >
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge tone={previewing.status === 'published' ? 'success' : 'warning'}>
                {previewing.status}
              </Badge>
              <Badge tone="primary">{previewing.audience}</Badge>
            </div>
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-ink-800">
              {previewing.body}
            </p>
          </div>
        </Modal>
      ) : null}

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
  onPreview,
}: {
  notice: Notice;
  canSend: boolean;
  onPublish: () => void;
  onDelete: () => void;
  onPreview: () => void;
}) {
  return (
    <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-ink-100 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap gap-2">
            <Badge tone={notice.status === 'published' ? 'success' : 'warning'}>
              {notice.status}
            </Badge>
            <Badge tone="primary">{notice.audience}</Badge>
          </div>
          <h2 className="font-display text-lg font-semibold text-ink-950">{notice.title}</h2>
          <p className="mt-2 line-clamp-3 whitespace-pre-wrap break-words text-sm text-ink-700">
            {notice.body}
          </p>
          <p className="mt-3 text-xs text-ink-400">
            {notice.createdByName ? `By ${notice.createdByName} · ` : ''}
            {notice.publishedAt
              ? `Published ${new Date(notice.publishedAt).toLocaleString()}`
              : `Created ${new Date(notice.createdAt).toLocaleString()}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canSend && notice.status === 'draft' ? (
            <Button type="button" size="sm" onClick={onPublish}>
              <Send className="h-4 w-4" aria-hidden="true" /> Publish
            </Button>
          ) : null}
          <RowActions
            onPreview={onPreview}
            onDelete={canSend ? onDelete : undefined}
          />
        </div>
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
