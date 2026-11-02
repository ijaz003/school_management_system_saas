import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookMarked,
  Plus,
  Send,
  Search,
  CalendarDays,
  GraduationCap,
  Clock,
  CheckCircle2,
  FileText,
  PenLine,
  MessageSquare,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { DateInput } from '@/components/ui/date-input';
import { FilterField, FiltersPanel } from '@/components/ui/filters-panel';
import { Input } from '@/components/ui/input';
import { ListPagination } from '@/components/ui/list-pagination';
import { MetricCard, MetricGrid } from '@/components/ui/metric-card';
import { Modal } from '@/components/ui/modal';
import { PageShell } from '@/components/ui/page-shell';
import { RowActions } from '@/components/ui/row-actions';
import { usePermission } from '@/hooks/usePermission';
import { useTenantDateTime } from '@/hooks/useTenantDateTime';
import { hasActiveFilters, resetListFilters } from '@/lib/list-filters';
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

/* ---------- helpers ---------- */

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

/* ---------- page ---------- */

export function DiaryListPage() {
  const { can } = usePermission();
  const canWrite = can('diary.write');
  const [filters, setFilters] = useState<DiaryFilters>({ page: 1, limit: 20 });
  const [creating, setCreating] = useState(false);
  const [previewing, setPreviewing] = useState<DiaryEntry | null>(null);
  const [deleting, setDeleting] = useState<DiaryEntry | null>(null);
  const classesQuery = useClasses();
  const diaryQuery = useDiaryEntries(filters);
  const publishEntry = usePublishDiaryEntry();
  const deleteEntry = useDeleteDiaryEntry();
  const items = diaryQuery.data?.items ?? [];
  const pagination = diaryQuery.data?.pagination;
  const classes = classesQuery.data ?? [];

  const totals = useMemo(() => {
    let drafts = 0;
    let published = 0;
    for (const e of items) {
      if (e.status === 'published') published += 1;
      else drafts += 1;
    }
    return { drafts, published, total: items.length };
  }, [items]);

  return (
    <AppLayout>
      {/* embedded animations — no external CSS */}
      <style>{`
        @keyframes diary-in {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        [data-diary-list] > * { animation: diary-in 200ms ease-out both; }
        [data-diary-list] > *:nth-child(2) { animation-delay: 30ms; }
        [data-diary-list] > *:nth-child(3) { animation-delay: 60ms; }
        [data-diary-list] > *:nth-child(4) { animation-delay: 90ms; }
      `}</style>

      <PageShell
        eyebrow="Communication"
        title="Daily diary"
        description="Record homework and class notes by class, section, and date."
        actions={
          canWrite ? (
            <Button onClick={() => setCreating(true)} className="transition active:scale-[0.98]">
              <Plus className="mr-1.5 h-3.5 w-3.5" aria-hidden />
              New entry
            </Button>
          ) : undefined
        }
        footerNote={
          <>
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            <span>Published entries are visible to parents and students on that class.</span>
          </>
        }
      >
        <MetricGrid>
          <MetricCard
            icon={<PenLine className="h-4 w-4" aria-hidden />}
            label="Drafts"
            value={totals.drafts}
            tone="warning"
          />
          <MetricCard
            icon={<CheckCircle2 className="h-4 w-4" aria-hidden />}
            label="Published"
            value={totals.published}
            tone="success"
          />
          <MetricCard
            icon={<BookMarked className="h-4 w-4" aria-hidden />}
            label="Shown"
            value={totals.total}
            tone="primary"
          />
        </MetricGrid>

        <FiltersPanel
          description="Search or narrow down by class, date, and status."
          pageLimit={filters.limit ?? 20}
          onPageLimitChange={(limit) => setFilters((current) => ({ ...current, limit, page: 1 }))}
          onClear={() => setFilters((current) => resetListFilters(current))}
          clearDisabled={!hasActiveFilters(filters)}
        >
          <FilterField
            id="diary-search"
            label="Search"
            icon={<Search className="h-3.5 w-3.5 text-ink-400" aria-hidden />}
            className="md:col-span-4"
          >
            <Input
              id="diary-search"
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
          </FilterField>

          <FilterField
            id="diary-class-filter"
            label="Class"
            icon={<GraduationCap className="h-3.5 w-3.5 text-ink-400" aria-hidden />}
            className="md:col-span-3"
          >
            <select
              id="diary-class-filter"
              aria-label="Filter by class"
              className="field-select w-full text-[13px]"
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
          </FilterField>

          <FilterField
            id="diary-date"
            label="Date"
            icon={<CalendarDays className="h-3.5 w-3.5 text-ink-400" aria-hidden />}
            className="md:col-span-3"
          >
            <DateInput
              id="diary-date"
              aria-label="Filter by date"
              className="w-full"
              value={filters.entryDate ?? ''}
              onChange={(iso) =>
                setFilters((current) => ({
                  ...current,
                  entryDate: iso || undefined,
                  page: 1,
                }))
              }
            />
          </FilterField>

          <FilterField id="diary-status" label="Status" className="md:col-span-2">
            <select
              id="diary-status"
              aria-label="Filter by status"
              className="field-select w-full text-[13px]"
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
          </FilterField>
        </FiltersPanel>
        {/* ---------- Results ---------- */}
        {diaryQuery.isPending ? (
          <SkeletonList />
        ) : diaryQuery.error ? (
          <div className="flex items-start gap-3 rounded-2xl bg-gradient-to-br from-danger-50 to-white p-5 shadow-sm ring-1 ring-danger-100">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-danger-100 text-danger-600">
              <AlertCircle className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold tracking-tight text-danger-800">
                Failed to load diary
              </p>
              <p className="mt-0.5 text-[13px] leading-relaxed text-danger-600">
                {diaryQuery.error.message}
              </p>
            </div>
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={BookMarked}
            title="No diary entries yet"
            description="Create the first homework diary for a class."
            action={
              canWrite ? (
                <Button onClick={() => setCreating(true)}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                  New entry
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div data-diary-list className="space-y-4">
            {items.map((entry) => (
              <DiaryCard
                key={entry.id}
                entry={entry}
                canWrite={canWrite}
                publishing={publishEntry.isPending && publishEntry.variables === entry.id}
                onPublish={() => publishEntry.mutate(entry.id)}
                onDelete={() => setDeleting(entry)}
                onPreview={() => setPreviewing(entry)}
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

      {creating && (
        <CreateDiaryModal classes={classes} onClose={() => setCreating(false)} />
      )}

      {previewing ? (
        <Modal
          open
          onClose={() => setPreviewing(null)}
          title={previewing.title}
          description="Diary entry preview"
          footer={
            <Button type="button" variant="outline" onClick={() => setPreviewing(null)}>
              Close
            </Button>
          }
        >
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge tone={previewing.status === 'published' ? 'success' : 'warning'}>
                {previewing.status}
              </Badge>
              {previewing.className ? <Badge tone="primary">{previewing.className}</Badge> : null}
            </div>
            {previewing.classwork ? (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                  Classwork
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-ink-800">
                  {previewing.classwork}
                </p>
              </div>
            ) : null}
            {previewing.homework ? (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                  Homework
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-ink-800">
                  {previewing.homework}
                </p>
              </div>
            ) : null}
            {previewing.remarks ? (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                  Remarks
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-ink-800">{previewing.remarks}</p>
              </div>
            ) : null}
          </div>
        </Modal>
      ) : null}

      <ConfirmDialog
        open={deleting !== null}
        title="Delete diary entry"
        description={deleting ? `Delete diary "${deleting.title}"?` : ''}
        confirmLabel="Delete"
        loading={deleteEntry.isPending}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return;
          deleteEntry.mutate(deleting.id, {
            onSettled: () => setDeleting(null),
          });
        }}
      />
    </AppLayout>
  );
}

/* ---------- stat card ---------- */

function DiaryCard({
  entry,
  canWrite,
  publishing,
  onPublish,
  onDelete,
  onPreview,
}: {
  entry: DiaryEntry;
  canWrite: boolean;
  publishing: boolean;
  onPublish: () => void;
  onDelete: () => void;
  onPreview: () => void;
}) {
  const { formatDate, formatDateTime } = useTenantDateTime();
  const isPublished = entry.status === 'published';
  const accent = isPublished ? 'bg-emerald-500' : 'bg-amber-500';

  return (
    <article className="group relative overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-ink-100 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md">
      <span
        aria-hidden
        className={`absolute inset-y-0 left-0 w-0.5 ${accent}`}
      />

      <div className="p-4 pl-5 sm:p-5 sm:pl-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {/* chips row */}
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              <Badge
                tone={isPublished ? 'success' : 'warning'}
                className="rounded-md px-2 py-0.5 text-[10.5px] font-medium capitalize tracking-tight"
              >
                {entry.status}
              </Badge>
              <span
                className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 text-[10.5px] font-medium text-ink-700 ring-1 ring-ink-100"
                style={tabularNums}
              >
                <CalendarDays className="h-3 w-3 text-ink-400" aria-hidden />
                {formatDate(entry.entryDate)}
              </span>
              {entry.className && (
                <span className="inline-flex items-center gap-1 rounded-md bg-primary-50 px-2 py-0.5 text-[10.5px] font-medium text-primary-700 ring-1 ring-primary-100">
                  <GraduationCap className="h-3 w-3" aria-hidden />
                  {entry.className}
                </span>
              )}
              {entry.sectionName && (
                <span className="inline-flex items-center rounded-md bg-ink-50 px-2 py-0.5 text-[10.5px] font-medium text-ink-600 ring-1 ring-ink-100">
                  {entry.sectionName}
                </span>
              )}
            </div>

            {/* title */}
            <h2 className="font-display text-[16px] font-semibold leading-tight tracking-tight text-ink-950">
              {entry.title}
            </h2>

            {/* content sections */}
            <div className="mt-3 space-y-2">
              <ContentBlock
                icon={<FileText className="h-3 w-3" aria-hidden />}
                label="Homework"
                body={entry.homework}
                tone="primary"
              />
              {entry.classwork && (
                <ContentBlock
                  icon={<BookMarked className="h-3 w-3" aria-hidden />}
                  label="Classwork"
                  body={entry.classwork}
                  tone="neutral"
                />
              )}
              {entry.remarks && (
                <ContentBlock
                  icon={<MessageSquare className="h-3 w-3" aria-hidden />}
                  label="Remarks"
                  body={entry.remarks}
                  tone="muted"
                />
              )}
            </div>

            {/* meta */}
            <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-ink-400">
              {entry.createdByName && (
                <>
                  <span>By {entry.createdByName}</span>
                  <span aria-hidden className="text-ink-300">·</span>
                </>
              )}
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" aria-hidden />
                <span
                  style={tabularNums}
                  title={
                    entry.publishedAt
                      ? formatDateTime(entry.publishedAt)
                      : formatDateTime(entry.createdAt)
                  }
                >
                  {entry.publishedAt
                    ? `Published ${relativeTime(entry.publishedAt, formatDate)}`
                    : `Created ${relativeTime(entry.createdAt, formatDate)}`}
                </span>
              </span>
            </p>
          </div>

          {/* actions */}
          <div className="flex shrink-0 items-center gap-1.5">
            {canWrite && !isPublished ? (
              <Button
                type="button"
                size="sm"
                onClick={onPublish}
                isLoading={publishing}
                className="transition active:scale-[0.98]"
              >
                <Send className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                Publish
              </Button>
            ) : null}
            <RowActions
              onPreview={onPreview}
              onDelete={canWrite ? onDelete : undefined}
              deleteLabel={`Delete diary ${entry.title}`}
            />
          </div>
        </div>
      </div>
    </article>
  );
}

function ContentBlock({
  icon,
  label,
  body,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  body: string;
  tone: 'primary' | 'neutral' | 'muted';
}) {
  const map = {
    primary: {
      wrap: 'bg-primary-50/50 ring-primary-100',
      label: 'text-primary-700',
      body: 'text-ink-800',
    },
    neutral: {
      wrap: 'bg-ink-50/70 ring-ink-100',
      label: 'text-ink-600',
      body: 'text-ink-700',
    },
    muted: {
      wrap: 'bg-ink-50/40 ring-ink-100',
      label: 'text-ink-500',
      body: 'text-ink-600',
    },
  } as const;
  const s = map[tone];
  return (
    <div className={`rounded-xl px-3 py-2 ring-1 ring-inset ${s.wrap}`}>
      <p
        className={`mb-0.5 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider ${s.label}`}
      >
        {icon}
        {label}
      </p>
      <p
        className={`whitespace-pre-wrap break-words text-[12.5px] leading-relaxed ${s.body}`}
      >
        {body}
      </p>
    </div>
  );
}

/* ---------- skeleton ---------- */

function SkeletonList() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ink-100"
        >
          <div className="space-y-3">
            <div className="flex gap-1.5">
              <div className="h-4 w-16 animate-pulse rounded bg-ink-100" />
              <div className="h-4 w-28 animate-pulse rounded bg-ink-100" />
              <div className="h-4 w-20 animate-pulse rounded bg-ink-100" />
            </div>
            <div className="h-4 w-2/3 animate-pulse rounded bg-ink-100" />
            <div className="space-y-2 pt-1">
              <div className="h-14 animate-pulse rounded-xl bg-ink-100" />
              <div className="h-10 animate-pulse rounded-xl bg-ink-100" />
            </div>
            <div className="h-3 w-1/3 animate-pulse rounded bg-ink-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- create modal ---------- */

function CreateDiaryModal({
  classes,
  onClose,
}: {
  classes: { id: string; name: string }[];
  onClose: () => void;
}) {
  const createEntry = useCreateDiaryEntry();
  const { todayIso } = useTenantDateTime();
  const [entryDate, setEntryDate] = useState(() => todayIso());
  const [classId, setClassId] = useState(classes[0]?.id ?? '');
  const [sectionId, setSectionId] = useState('');
  const [title, setTitle] = useState('');
  const [homework, setHomework] = useState('');
  const [classwork, setClasswork] = useState('');
  const [remarks, setRemarks] = useState('');
  const [publish, setPublish] = useState<null | 'draft' | 'publish'>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const sectionsQuery = useSections(classId);
  const sections = sectionsQuery.data ?? [];

  useEffect(() => {
    const id = window.setTimeout(() => titleRef.current?.focus(), 60);
    return () => window.clearTimeout(id);
  }, []);

  const canSubmit = useMemo(
    () =>
      Boolean(
        entryDate &&
          classId &&
          title.trim().length >= 3 &&
          homework.trim().length > 0,
      ),
    [classId, entryDate, homework, title],
  );

  const submit = (asPublish: boolean) => {
    if (!canSubmit || createEntry.isPending) return;
    setPublish(asPublish ? 'publish' : 'draft');
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
      {
        onSuccess: onClose,
        onSettled: () => setPublish(null),
      },
    );
  };

  const savingDraft = createEntry.isPending && publish === 'draft';
  const publishing = createEntry.isPending && publish === 'publish';

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
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={createEntry.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => submit(false)}
            isLoading={savingDraft}
            disabled={createEntry.isPending || !canSubmit}
          >
            Save draft
          </Button>
          <Button
            type="button"
            onClick={() => submit(true)}
            isLoading={publishing}
            disabled={createEntry.isPending || !canSubmit}
          >
            <Send className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            Publish
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Section 1 — placement */}
        <ModalSection
          icon={<CalendarDays className="h-4 w-4" aria-hidden />}
          title="Where & when"
          description="Pick the date and target the right class and section."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <DateInput
              label="Date *"
              value={entryDate}
              onChange={setEntryDate}
            />
            <div>
              <label
                htmlFor="diary-class"
                className="mb-1.5 block text-[12px] font-medium text-ink-800"
              >
                Class <span className="text-danger-500">*</span>
              </label>
              <select
                id="diary-class"
                className="field-select w-full text-[13px]"
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
            <label
              htmlFor="diary-section"
              className="mb-1.5 block text-[12px] font-medium text-ink-800"
            >
              Section
            </label>
            <select
              id="diary-section"
              className="field-select w-full text-[13px]"
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
        </ModalSection>

        {/* Section 2 — content */}
        <ModalSection
          icon={<PenLine className="h-4 w-4" aria-hidden />}
          title="Content"
          description="Homework is required. Classwork and remarks are optional."
        >
          <Input
            ref={titleRef}
            label="Title *"
            placeholder="e.g. Chapter 4 — Fractions"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />

          <div>
            <label
              htmlFor="diary-homework"
              className="mb-1.5 block text-[12px] font-medium text-ink-800"
            >
              Homework <span className="text-danger-500">*</span>
            </label>
            <textarea
              id="diary-homework"
              rows={4}
              className="field-select min-h-[110px] w-full resize-y text-[13px] leading-relaxed"
              value={homework}
              onChange={(event) => setHomework(event.target.value)}
              placeholder="Describe the homework assignment..."
            />
            <p className="mt-1 text-[11px] text-ink-400" style={tabularNums}>
              {homework.length} chars
            </p>
          </div>

          <div>
            <label
              htmlFor="diary-classwork"
              className="mb-1.5 block text-[12px] font-medium text-ink-800"
            >
              Classwork
            </label>
            <textarea
              id="diary-classwork"
              rows={3}
              className="field-select w-full resize-y text-[13px] leading-relaxed"
              value={classwork}
              onChange={(event) => setClasswork(event.target.value)}
              placeholder="What was covered in class?"
            />
          </div>

          <div>
            <label
              htmlFor="diary-remarks"
              className="mb-1.5 block text-[12px] font-medium text-ink-800"
            >
              Remarks
            </label>
            <textarea
              id="diary-remarks"
              rows={2}
              className="field-select w-full resize-y text-[13px] leading-relaxed"
              value={remarks}
              onChange={(event) => setRemarks(event.target.value)}
              placeholder="Any notes for parents..."
            />
          </div>
        </ModalSection>

        <p className="flex items-start gap-1.5 rounded-lg bg-ink-50/70 px-3 py-2 text-[11.5px] leading-relaxed text-ink-500 ring-1 ring-ink-100">
          <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-ink-400" aria-hidden />
          Drafts stay private. Published entries appear in the parent and
          student diary for that class.
        </p>
      </div>
    </Modal>
  );
}

function ModalSection({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-700 ring-1 ring-primary-100">
          {icon}
        </span>
        <div className="min-w-0">
          <h3 className="font-display text-[13.5px] font-semibold tracking-tight text-ink-950">
            {title}
          </h3>
          {description && (
            <p className="mt-0.5 text-[11.5px] leading-relaxed text-ink-500">
              {description}
            </p>
          )}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}