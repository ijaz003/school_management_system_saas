import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ClipboardList, Plus, Search } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { FilterField, FiltersPanel } from '@/components/ui/filters-panel';
import { Input } from '@/components/ui/input';
import { ListPagination } from '@/components/ui/list-pagination';
import { Modal } from '@/components/ui/modal';
import { PageShell } from '@/components/ui/page-shell';
import { RowActions } from '@/components/ui/row-actions';
import { PageLoader } from '@/components/ui/spinner';
import { useClasses } from '@/features/school/classes/hooks/useClasses';
import { useClass } from '@/features/school/classes/hooks/useClass';
import { usePermission } from '@/hooks/usePermission';
import { hasActiveFilters, resetListFilters } from '@/lib/list-filters';
import {
  useCreateExam,
  useDeleteExam,
  useExams,
  type ExamListItem,
} from '../hooks/useExams';
import type { ExamFilters, ExamStatus } from '../hooks/keys';

const statusTones: Record<ExamStatus, 'neutral' | 'primary' | 'warning' | 'success'> = {
  draft: 'neutral',
  scheduled: 'primary',
  marks_entry: 'warning',
  published: 'success',
};

export function ExamsListPage() {
  const { can } = usePermission();
  const canSchedule = can('exams.schedule.create');
  const [filters, setFilters] = useState<ExamFilters>({ page: 1, limit: 20 });
  const [creating, setCreating] = useState(false);
  const [examToDelete, setExamToDelete] = useState<ExamListItem | null>(null);
  const examsQuery = useExams(filters);
  const deleteExam = useDeleteExam();
  const classesQuery = useClasses();
  const items = examsQuery.data?.items ?? [];
  const pagination = examsQuery.data?.pagination;

  return (
    <AppLayout>
      <PageShell
          eyebrow="Academic"
          title="Exams"
          description="Schedule exams, enter marks, and publish results."
          actions={
            canSchedule ? (
              <Button onClick={() => setCreating(true)}>
                <Plus className="h-4 w-4" aria-hidden="true" /> New exam
              </Button>
            ) : undefined
          }
      >

        <FiltersPanel
          description="Find exams by name, status, or class."
          pageLimit={filters.limit ?? 20}
          onPageLimitChange={(limit) => setFilters((current) => ({ ...current, limit, page: 1 }))}
          onClear={() => setFilters((current) => resetListFilters(current))}
          clearDisabled={!hasActiveFilters(filters)}
        >
          <FilterField
            id="exam-search"
            label="Search"
            icon={<Search className="h-3.5 w-3.5 text-ink-400" aria-hidden="true" />}
            className="md:col-span-5"
          >
            <Input
              id="exam-search"
              type="search"
              aria-label="Search exams"
              placeholder="Search exams..."
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
          <FilterField id="exam-status-filter" label="Status" className="md:col-span-3">
            <select
              id="exam-status-filter"
              aria-label="Filter by status"
              className="field-select"
              value={filters.status ?? ''}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  status: (event.target.value || undefined) as ExamStatus | undefined,
                  page: 1,
                }))
              }
            >
              <option value="">All statuses</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="marks_entry">Marks entry</option>
              <option value="published">Published</option>
            </select>
          </FilterField>
          <FilterField id="exam-class-filter" label="Class" className="md:col-span-4">
            <select
              id="exam-class-filter"
              aria-label="Filter by class"
              className="field-select"
              value={filters.classId ?? ''}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  classId: event.target.value || undefined,
                  page: 1,
                }))
              }
            >
              <option value="">All classes</option>
              {(classesQuery.data ?? []).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </FilterField>
        </FiltersPanel>

        {examsQuery.isPending ? (
          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-ink-100">
            <PageLoader compact />
          </div>
        ) : examsQuery.error ? (
          <section className="rounded-2xl border border-danger-100 bg-white p-8 text-center shadow-sm">
            <h2 className="font-semibold text-ink-950">Failed to load exams</h2>
            <p className="mt-2 text-sm text-ink-700">{examsQuery.error.message}</p>
          </section>
        ) : items.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No exams yet"
            description="Create your first exam schedule."
          />
        ) : (
          <div className="space-y-3">
            {items.map((exam) => (
              <ExamRow
                key={exam.id}
                exam={exam}
                canSchedule={canSchedule}
                onDelete={() => setExamToDelete(exam)}
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

      {creating && <CreateExamModal onClose={() => setCreating(false)} />}

      <ConfirmDialog
        open={examToDelete !== null}
        title="Delete exam?"
        description={`Delete exam "${examToDelete?.name ?? ''}"? Its schedule will be removed.`}
        confirmLabel="Delete"
        loading={deleteExam.isPending}
        onClose={() => setExamToDelete(null)}
        onConfirm={() => {
          if (!examToDelete) return;
          deleteExam.mutate(examToDelete.id, { onSettled: () => setExamToDelete(null) });
        }}
      />
    </AppLayout>
  );
}

function ExamRow({
  exam,
  canSchedule,
  onDelete,
}: {
  exam: ExamListItem;
  canSchedule: boolean;
  onDelete: () => void;
}) {
  const navigate = useNavigate();

  return (
    <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ink-100">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <Link to={`/exams/${exam.id}`} className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap gap-2">
            <Badge tone={statusTones[exam.status]}>{exam.status.replace('_', ' ')}</Badge>
            <Badge tone="primary">{exam.className}</Badge>
          </div>
          <h2 className="font-display text-lg font-semibold text-ink-950">{exam.name}</h2>
          <p className="mt-1 text-sm text-ink-700">
            {exam.startDate} → {exam.endDate}
            {exam.term ? ` · ${exam.term}` : ''}
            {exam.academicYear ? ` · ${exam.academicYear}` : ''}
            {` · ${exam.subjectsCount} subject${exam.subjectsCount === 1 ? '' : 's'}`}
          </p>
        </Link>
        <RowActions
          onPreview={() => navigate(`/exams/${exam.id}`)}
          onDelete={
            canSchedule && exam.status !== 'published' ? onDelete : undefined
          }
        />
      </div>
    </article>
  );
}

function CreateExamModal({ onClose }: { onClose: () => void }) {
  const createExam = useCreateExam();
  const classesQuery = useClasses();
  const [name, setName] = useState('');
  const [classId, setClassId] = useState('');
  const [term, setTerm] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [subjectDraft, setSubjectDraft] = useState<
    Record<string, { selected: boolean; maxMarks: string; passMarks: string }>
  >({});

  const classQuery = useClass(classId);
  const classSubjects = classQuery.data?.subjects ?? [];

  const toggleSubject = (subjectId: string) => {
    setSubjectDraft((current) => {
      const existing = current[subjectId];
      return {
        ...current,
        [subjectId]: {
          selected: !existing?.selected,
          maxMarks: existing?.maxMarks ?? '100',
          passMarks: existing?.passMarks ?? '40',
        },
      };
    });
  };

  const submit = () => {
    if (!name.trim() || !classId || !startDate || !endDate) return;
    const subjects = classSubjects
      .filter((subject) => subjectDraft[subject.id]?.selected)
      .map((subject) => ({
        subjectId: subject.id,
        maxMarks: Number(subjectDraft[subject.id]?.maxMarks || 100),
        passMarks: Number(subjectDraft[subject.id]?.passMarks || 40),
      }));

    createExam.mutate(
      {
        name: name.trim(),
        classId,
        term: term.trim() || undefined,
        academicYear: academicYear.trim() || undefined,
        startDate,
        endDate,
        status: subjects.length > 0 ? 'scheduled' : 'draft',
        subjects: subjects.length > 0 ? subjects : undefined,
      },
      { onSuccess: onClose },
    );
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="New exam"
      description="Create a schedule for a class and optionally attach subjects."
      size="lg"
      closeDisabled={createExam.isPending}
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={createExam.isPending}>
            Cancel
          </Button>
          <Button type="button" onClick={submit} isLoading={createExam.isPending}>
            Create exam
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input label="Name *" value={name} onChange={(event) => setName(event.target.value)} />
        <div>
          <label htmlFor="exam-class" className="mb-1.5 block text-sm font-medium text-ink-800">
            Class *
          </label>
          <select
            id="exam-class"
            className="field-select"
            value={classId}
            onChange={(event) => {
              setClassId(event.target.value);
              setSubjectDraft({});
            }}
          >
            <option value="">Select class</option>
            {(classesQuery.data ?? []).map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Term" value={term} onChange={(event) => setTerm(event.target.value)} />
          <Input
            label="Academic year"
            placeholder="2025-26"
            value={academicYear}
            onChange={(event) => setAcademicYear(event.target.value)}
          />
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

        {classId && (
          <div>
            <p className="mb-2 text-sm font-medium text-ink-800">Subjects</p>
            {classQuery.isPending ? (
              <p className="text-sm text-ink-700/70">Loading class subjects…</p>
            ) : classSubjects.length === 0 ? (
              <p className="text-sm text-ink-700/70">
                No subjects on this class. Assign subjects in Settings → Classes first.
              </p>
            ) : (
              <ul className="max-h-56 space-y-2 overflow-y-auto rounded-xl border border-ink-100 p-3">
                {classSubjects.map((subject) => {
                  const draft = subjectDraft[subject.id];
                  return (
                    <li key={subject.id} className="rounded-lg bg-ink-50/60 p-3">
                      <label className="flex items-center gap-2 text-sm font-medium text-ink-950">
                        <input
                          type="checkbox"
                          checked={Boolean(draft?.selected)}
                          onChange={() => toggleSubject(subject.id)}
                        />
                        {subject.name}{' '}
                        <span className="text-xs text-ink-700/60">({subject.code})</span>
                      </label>
                      {draft?.selected && (
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          <Input
                            label="Max"
                            type="number"
                            min={1}
                            value={draft.maxMarks}
                            onChange={(event) =>
                              setSubjectDraft((current) => ({
                                ...current,
                                [subject.id]: {
                                  ...current[subject.id]!,
                                  maxMarks: event.target.value,
                                },
                              }))
                            }
                          />
                          <Input
                            label="Pass"
                            type="number"
                            min={0}
                            value={draft.passMarks}
                            onChange={(event) =>
                              setSubjectDraft((current) => ({
                                ...current,
                                [subject.id]: {
                                  ...current[subject.id]!,
                                  passMarks: event.target.value,
                                },
                              }))
                            }
                          />
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
