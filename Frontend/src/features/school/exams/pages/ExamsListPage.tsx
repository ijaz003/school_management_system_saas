import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Plus, Trash2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { PageLoader } from '@/components/ui/spinner';
import { useClasses } from '@/features/school/classes/hooks/useClasses';
import { useClass } from '@/features/school/classes/hooks/useClass';
import { usePermission } from '@/hooks/usePermission';
import {
  useCreateExam,
  useDeleteExam,
  useExams,
  type ExamListItem,
} from '../hooks/useExams';
import type { ExamFilters, ExamStatus } from '../hooks/keys';

const selectClass =
  'w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500';

const statusStyles: Record<ExamStatus, string> = {
  draft: 'bg-ink-100 text-ink-700',
  scheduled: 'bg-blue-100 text-blue-800',
  marks_entry: 'bg-amber-100 text-amber-800',
  published: 'bg-green-100 text-green-800',
};

export function ExamsListPage() {
  const { can } = usePermission();
  const canSchedule = can('exams.schedule.create');
  const [filters, setFilters] = useState<ExamFilters>({ page: 1, limit: 20 });
  const [creating, setCreating] = useState(false);
  const examsQuery = useExams(filters);
  const deleteExam = useDeleteExam();
  const classesQuery = useClasses();
  const items = examsQuery.data?.items ?? [];
  const pagination = examsQuery.data?.pagination;

  return (
    <AppLayout>
      <div className="space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600">
              Academic
            </p>
            <h1 className="page-title mt-1 text-2xl">Exams</h1>
            <p className="page-subtitle">Schedule exams, enter marks, and publish results.</p>
          </div>
          {canSchedule && (
            <Button onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" /> New exam
            </Button>
          )}
        </header>

        <section className="panel grid gap-3 p-4 md:grid-cols-12">
          <div className="md:col-span-5">
            <Input
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
          </div>
          <select
            aria-label="Filter by status"
            className={`${selectClass} md:col-span-3`}
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
          <select
            aria-label="Filter by class"
            className={`${selectClass} md:col-span-4`}
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
        </section>

        {examsQuery.isPending ? (
          <div className="panel p-12">
            <PageLoader />
          </div>
        ) : examsQuery.error ? (
          <section className="rounded-2xl border border-red-200 bg-white p-8 text-center">
            <h2 className="font-semibold text-ink-950">Failed to load exams</h2>
            <p className="mt-2 text-sm text-ink-700">{examsQuery.error.message}</p>
          </section>
        ) : items.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-ink-200 bg-white px-6 py-14 text-center">
            <ClipboardList className="mx-auto h-10 w-10 text-ink-200" aria-hidden="true" />
            <h2 className="mt-3 font-semibold text-ink-950">No exams yet</h2>
            <p className="mt-1 text-sm text-ink-700/70">Create your first exam schedule.</p>
          </section>
        ) : (
          <div className="space-y-3">
            {items.map((exam) => (
              <ExamRow
                key={exam.id}
                exam={exam}
                canSchedule={canSchedule}
                onDelete={() => {
                  if (window.confirm(`Delete exam "${exam.name}"?`)) {
                    deleteExam.mutate(exam.id);
                  }
                }}
              />
            ))}
          </div>
        )}

        {pagination && pagination.totalPages > 1 && (
          <footer className="flex justify-between gap-3">
            <p className="text-sm text-ink-700/70">
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

      {creating && <CreateExamModal onClose={() => setCreating(false)} />}
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
  return (
    <article className="panel p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <Link to={`/exams/${exam.id}`} className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusStyles[exam.status]}`}
            >
              {exam.status.replace('_', ' ')}
            </span>
            <span className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700">
              {exam.className}
            </span>
          </div>
          <h2 className="font-display text-lg font-semibold text-ink-950">{exam.name}</h2>
          <p className="mt-1 text-sm text-ink-700">
            {exam.startDate} → {exam.endDate}
            {exam.term ? ` · ${exam.term}` : ''}
            {exam.academicYear ? ` · ${exam.academicYear}` : ''}
            {` · ${exam.subjectsCount} subject${exam.subjectsCount === 1 ? '' : 's'}`}
          </p>
        </Link>
        {canSchedule && exam.status !== 'published' && (
          <Button type="button" size="sm" variant="ghost" onClick={onDelete} aria-label="Delete">
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        )}
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
            className={selectClass}
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
        <div className="grid gap-4 sm:grid-cols-2">
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
