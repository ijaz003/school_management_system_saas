import { useMemo, useState } from 'react';
import { BookMarked, Plus, Send, Trash2 } from 'lucide-react';
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
import { useClasses } from '@/features/school/classes/hooks/useClasses';
import { useSections } from '@/features/school/classes/hooks/useSections';
import {
  useCreateDiaryEntry,
  useDeleteDiaryEntry,
  useDiaryEntries,
  usePublishDiaryEntry,
  type DiaryEntry,
} from '../hooks/useDiary';
import type { DiaryFilters, DiaryStatus } from '../hooks/keys';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function DiaryListPage() {
  const { can } = usePermission();
  const canWrite = can('diary.write');
  const [filters, setFilters] = useState<DiaryFilters>({ page: 1, limit: 20 });
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<DiaryEntry | null>(null);
  const classesQuery = useClasses();
  const diaryQuery = useDiaryEntries(filters);
  const publishEntry = usePublishDiaryEntry();
  const deleteEntry = useDeleteDiaryEntry();
  const items = diaryQuery.data?.items ?? [];
  const pagination = diaryQuery.data?.pagination;
  const classes = classesQuery.data ?? [];

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Communication"
          title="Daily diary"
          description="Record homework and class notes by class, section, and date."
          actions={
            canWrite ? (
              <Button onClick={() => setCreating(true)}>
                <Plus className="h-4 w-4" aria-hidden="true" /> New entry
              </Button>
            ) : undefined
          }
        />

        <section className="panel grid grid-cols-1 gap-3 p-4 md:grid-cols-12">
          <div className="md:col-span-4">
            <Input
              type="search"
              aria-label="Search diary"
              placeholder="Search diary..."
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
            aria-label="Filter by class"
            className="field-select md:col-span-3"
            value={filters.classId ?? ''}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                classId: event.target.value || undefined,
                sectionId: undefined,
                page: 1,
              }))
            }
          >
            <option value="">All classes</option>
            {classes.map((klass) => (
              <option key={klass.id} value={klass.id}>
                {klass.name}
              </option>
            ))}
          </select>
          <Input
            type="date"
            aria-label="Filter by date"
            className="md:col-span-3"
            value={filters.entryDate ?? ''}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                entryDate: event.target.value || undefined,
                page: 1,
              }))
            }
          />
          <select
            aria-label="Filter by status"
            className="field-select md:col-span-2"
            value={filters.status ?? ''}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                status: (event.target.value || undefined) as DiaryStatus | undefined,
                page: 1,
              }))
            }
          >
            <option value="">All</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </section>

        {diaryQuery.isPending ? (
          <div className="panel">
            <PageLoader compact />
          </div>
        ) : diaryQuery.error ? (
          <section className="panel border-danger-100 p-8 text-center">
            <h2 className="font-display font-semibold text-ink-950">Failed to load diary</h2>
            <p className="mt-2 text-sm text-ink-600">{diaryQuery.error.message}</p>
          </section>
        ) : items.length === 0 ? (
          <EmptyState
            icon={BookMarked}
            title="No diary entries yet"
            description="Create the first homework diary for a class."
            action={
              canWrite ? (
                <Button onClick={() => setCreating(true)}>
                  <Plus className="h-4 w-4" aria-hidden="true" /> New entry
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="space-y-4">
            {items.map((entry) => (
              <DiaryCard
                key={entry.id}
                entry={entry}
                canWrite={canWrite}
                onPublish={() => publishEntry.mutate(entry.id)}
                onDelete={() => setDeleting(entry)}
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

      {creating && (
        <CreateDiaryModal classes={classes} onClose={() => setCreating(false)} />
      )}

      <ConfirmDialog
        open={deleting !== null}
        title="Delete diary entry"
        description={deleting ? `Delete diary "${deleting.title}"?` : ''}
        confirmLabel="Delete"
        loading={deleteEntry.isPending}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return;
          deleteEntry.mutate(deleting.id, { onSettled: () => setDeleting(null) });
        }}
      />
    </AppLayout>
  );
}

function DiaryCard({
  entry,
  canWrite,
  onPublish,
  onDelete,
}: {
  entry: DiaryEntry;
  canWrite: boolean;
  onPublish: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="panel p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap gap-2">
            <Badge tone={entry.status === 'published' ? 'success' : 'warning'}>
              {entry.status}
            </Badge>
            <Badge tone="primary">{entry.entryDate}</Badge>
            {entry.className && <Badge>{entry.className}</Badge>}
            {entry.sectionName && <Badge>{entry.sectionName}</Badge>}
          </div>
          <h2 className="font-display text-lg font-semibold text-ink-950">{entry.title}</h2>
          <div className="mt-3 space-y-2 text-sm text-ink-700">
            <p>
              <span className="font-medium text-ink-900">Homework: </span>
              <span className="whitespace-pre-wrap break-words">{entry.homework}</span>
            </p>
            {entry.classwork && (
              <p>
                <span className="font-medium text-ink-900">Classwork: </span>
                <span className="whitespace-pre-wrap break-words">{entry.classwork}</span>
              </p>
            )}
            {entry.remarks && (
              <p>
                <span className="font-medium text-ink-900">Remarks: </span>
                <span className="whitespace-pre-wrap break-words">{entry.remarks}</span>
              </p>
            )}
          </div>
          <p className="mt-3 text-xs text-ink-400">
            {entry.createdByName ? `By ${entry.createdByName} · ` : ''}
            {entry.publishedAt
              ? `Published ${new Date(entry.publishedAt).toLocaleString()}`
              : `Created ${new Date(entry.createdAt).toLocaleString()}`}
          </p>
        </div>
        {canWrite && (
          <div className="flex gap-2">
            {entry.status === 'draft' && (
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

function CreateDiaryModal({
  classes,
  onClose,
}: {
  classes: { id: string; name: string }[];
  onClose: () => void;
}) {
  const createEntry = useCreateDiaryEntry();
  const [entryDate, setEntryDate] = useState(todayIso());
  const [classId, setClassId] = useState(classes[0]?.id ?? '');
  const [sectionId, setSectionId] = useState('');
  const [title, setTitle] = useState('');
  const [homework, setHomework] = useState('');
  const [classwork, setClasswork] = useState('');
  const [remarks, setRemarks] = useState('');
  const [publish, setPublish] = useState(false);
  const sectionsQuery = useSections(classId);
  const sections = sectionsQuery.data ?? [];

  const canSubmit = useMemo(
    () => Boolean(entryDate && classId && title.trim().length >= 3 && homework.trim()),
    [classId, entryDate, homework, title],
  );

  const submit = (asPublish: boolean) => {
    if (!canSubmit) return;
    createEntry.mutate(
      {
        entryDate,
        classId,
        sectionId: sectionId || null,
        title: title.trim(),
        homework: homework.trim(),
        classwork: classwork.trim() || null,
        remarks: remarks.trim() || null,
        publish: asPublish,
      },
      { onSuccess: onClose },
    );
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="New diary entry"
      description="Save a draft or publish for parents and students."
      size="lg"
      closeDisabled={createEntry.isPending}
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={createEntry.isPending}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => submit(false)}
            isLoading={createEntry.isPending && !publish}
            disabled={createEntry.isPending || !canSubmit}
          >
            Save draft
          </Button>
          <Button
            type="button"
            onClick={() => {
              setPublish(true);
              submit(true);
            }}
            isLoading={createEntry.isPending && publish}
            disabled={createEntry.isPending || !canSubmit}
          >
            Publish
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Date *"
            type="date"
            value={entryDate}
            onChange={(event) => setEntryDate(event.target.value)}
          />
          <div>
            <label htmlFor="diary-class" className="mb-1.5 block text-sm font-medium text-ink-800">
              Class *
            </label>
            <select
              id="diary-class"
              className="field-select"
              value={classId}
              onChange={(event) => {
                setClassId(event.target.value);
                setSectionId('');
              }}
            >
              <option value="">Select class</option>
              {classes.map((klass) => (
                <option key={klass.id} value={klass.id}>
                  {klass.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="diary-section" className="mb-1.5 block text-sm font-medium text-ink-800">
            Section
          </label>
          <select
            id="diary-section"
            className="field-select"
            value={sectionId}
            onChange={(event) => setSectionId(event.target.value)}
            disabled={!classId}
          >
            <option value="">All sections</option>
            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.name}
              </option>
            ))}
          </select>
        </div>
        <Input label="Title *" value={title} onChange={(event) => setTitle(event.target.value)} />
        <div>
          <label htmlFor="diary-homework" className="mb-1.5 block text-sm font-medium text-ink-800">
            Homework *
          </label>
          <textarea
            id="diary-homework"
            rows={4}
            className="field-select"
            value={homework}
            onChange={(event) => setHomework(event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="diary-classwork" className="mb-1.5 block text-sm font-medium text-ink-800">
            Classwork
          </label>
          <textarea
            id="diary-classwork"
            rows={3}
            className="field-select"
            value={classwork}
            onChange={(event) => setClasswork(event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="diary-remarks" className="mb-1.5 block text-sm font-medium text-ink-800">
            Remarks
          </label>
          <textarea
            id="diary-remarks"
            rows={2}
            className="field-select"
            value={remarks}
            onChange={(event) => setRemarks(event.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}
