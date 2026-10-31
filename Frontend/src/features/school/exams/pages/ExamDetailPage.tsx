import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCheck, ClipboardList, Send, Users } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { PageLoader } from '@/components/ui/spinner';
import { useSections } from '@/features/school/classes/hooks/useSections';
import { usePermission } from '@/hooks/usePermission';
import {
  useExam,
  useExamResults,
  useMarksSheet,
  useOpenMarksEntry,
  usePublishExam,
  useSaveMarks,
} from '../hooks/useExams';
import type { ExamStatus } from '../hooks/keys';

const statusTones: Record<ExamStatus, 'neutral' | 'primary' | 'warning' | 'success'> = {
  draft: 'neutral',
  scheduled: 'primary',
  marks_entry: 'warning',
  published: 'success',
};

type DraftMark = {
  marksObtained: string;
  isAbsent: boolean;
};

export function ExamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { can } = usePermission();
  const canEnterMarks = can('exams.marks.enter');
  const canPublish = can('exams.result.publish');
  const canOpenMarks = can('exams.schedule.create') || canEnterMarks;

  const examQuery = useExam(id);
  const openMarks = useOpenMarksEntry();
  const publishExam = usePublishExam();
  const saveMarks = useSaveMarks();

  const exam = examQuery.data;
  const sectionsQuery = useSections(exam?.classId ?? '');
  const resultsQuery = useExamResults(
    exam?.status === 'published' || exam?.status === 'marks_entry' ? id : undefined,
  );

  const [examSubjectId, setExamSubjectId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [draft, setDraft] = useState<Record<string, DraftMark>>({});
  const [tab, setTab] = useState<'marks' | 'results'>('marks');
  const [confirmPublish, setConfirmPublish] = useState(false);

  const sheetQuery = useMarksSheet(id, examSubjectId, sectionId);

  useEffect(() => {
    setExamSubjectId('');
    setSectionId('');
    setDraft({});
  }, [id]);

  useEffect(() => {
    if (!sheetQuery.data) {
      setDraft({});
      return;
    }
    const next: Record<string, DraftMark> = {};
    for (const record of sheetQuery.data.records) {
      next[record.studentId] = {
        marksObtained:
          record.marksObtained === null || record.marksObtained === undefined
            ? ''
            : String(record.marksObtained),
        isAbsent: record.isAbsent,
      };
    }
    setDraft(next);
  }, [sheetQuery.data]);

  if (examQuery.isPending) {
    return (
      <AppLayout>
        <div className="panel">
          <PageLoader compact />
        </div>
      </AppLayout>
    );
  }

  if (examQuery.error || !exam) {
    return (
      <AppLayout>
        <EmptyState
          icon={ClipboardList}
          title="Exam not found"
          description={examQuery.error?.message ?? 'This exam may have been deleted.'}
          action={
            <Link
              to="/exams"
              className="inline-flex items-center justify-center rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium text-ink-800 hover:bg-ink-50"
            >
              Back to exams
            </Link>
          }
        />
      </AppLayout>
    );
  }

  const subjects = exam.subjects;
  const records = sheetQuery.data?.records ?? [];
  const readOnly = sheetQuery.data?.readOnly || exam.status === 'published';
  const maxMarks = sheetQuery.data?.examSubject.maxMarks ?? 0;

  const handleSave = () => {
    if (!id || !examSubjectId || !sectionId) return;
    const payload = records.map((record) => {
      const row = draft[record.studentId];
      const isAbsent = Boolean(row?.isAbsent);
      return {
        studentId: record.studentId,
        isAbsent,
        marksObtained: isAbsent
          ? null
          : row?.marksObtained === '' || row?.marksObtained === undefined
            ? null
            : Number(row.marksObtained),
      };
    });

    const incomplete = payload.some(
      (row) => !row.isAbsent && (row.marksObtained === null || Number.isNaN(row.marksObtained)),
    );
    if (incomplete) {
      window.alert('Enter marks for every student, or mark them absent.');
      return;
    }

    saveMarks.mutate({
      examId: id,
      examSubjectId,
      sectionId,
      records: payload,
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <Link
            to="/exams"
            className="inline-flex items-center gap-1 text-sm text-ink-700/70 hover:text-ink-950"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to exams
          </Link>
        </div>

        <PageHeader
          eyebrow={exam.className}
          title={exam.name}
          description={[
            `${exam.startDate} → ${exam.endDate}`,
            exam.term,
          ]
            .filter(Boolean)
            .join(' · ')}
          actions={
            <>
              <Badge tone={statusTones[exam.status]}>{exam.status.replace('_', ' ')}</Badge>
              {canOpenMarks &&
                (exam.status === 'draft' || exam.status === 'scheduled') &&
                subjects.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => openMarks.mutate(exam.id)}
                    isLoading={openMarks.isPending}
                  >
                    Open marks entry
                  </Button>
                )}
              {canPublish && exam.status !== 'published' && exam.status !== 'draft' && (
                <Button onClick={() => setConfirmPublish(true)} isLoading={publishExam.isPending}>
                  <Send className="h-4 w-4" aria-hidden="true" /> Publish results
                </Button>
              )}
            </>
          }
        />

        <section className="panel p-5">
          <h2 className="font-semibold text-ink-950">Subjects</h2>
          {subjects.length === 0 ? (
            <p className="mt-2 text-sm text-ink-700/70">No subjects attached to this exam.</p>
          ) : (
            <ul className="mt-3 flex flex-wrap gap-2">
              {subjects.map((subject) => (
                <li
                  key={subject.id}
                  className="rounded-lg bg-ink-50 px-3 py-2 text-sm text-ink-800"
                >
                  {subject.subjectName} · max {subject.maxMarks} · pass {subject.passMarks}
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="flex gap-2 border-b border-ink-200">
          <button
            type="button"
            className={`border-b-2 px-4 py-2.5 text-sm font-medium ${
              tab === 'marks'
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-ink-700/70'
            }`}
            onClick={() => setTab('marks')}
          >
            Marks entry
          </button>
          <button
            type="button"
            className={`border-b-2 px-4 py-2.5 text-sm font-medium ${
              tab === 'results'
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-ink-700/70'
            }`}
            onClick={() => setTab('results')}
          >
            Results
          </button>
        </div>

        {tab === 'marks' ? (
          <div className="space-y-4">
            <section className="panel grid grid-cols-1 gap-3 p-4 md:grid-cols-12">
              <select
                aria-label="Exam subject"
                className="field-select md:col-span-6"
                value={examSubjectId}
                onChange={(event) => setExamSubjectId(event.target.value)}
              >
                <option value="">Select subject</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.subjectName}
                  </option>
                ))}
              </select>
              <select
                aria-label="Section"
                className="field-select md:col-span-6"
                value={sectionId}
                onChange={(event) => setSectionId(event.target.value)}
              >
                <option value="">Select section</option>
                {(sectionsQuery.data ?? []).map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.name}
                  </option>
                ))}
              </select>
            </section>

            {examSubjectId && sectionId && (
              <>
                {canEnterMarks && !readOnly && records.length > 0 && (
                  <div className="flex justify-end">
                    <Button onClick={handleSave} isLoading={saveMarks.isPending}>
                      <CheckCheck className="h-4 w-4" aria-hidden="true" /> Save marks
                    </Button>
                  </div>
                )}

                {sheetQuery.isPending ? (
                  <div className="panel">
                    <PageLoader compact />
                  </div>
                ) : sheetQuery.error ? (
                  <section className="rounded-2xl border border-red-200 bg-white p-8 text-center">
                    <h2 className="font-semibold text-ink-950">Failed to load marks sheet</h2>
                    <p className="mt-2 text-sm text-ink-700">{sheetQuery.error.message}</p>
                  </section>
                ) : records.length === 0 ? (
                  <EmptyState
                    icon={Users}
                    title="No students in this section"
                    description="Enrol students in this section to enter marks."
                  />
                ) : (
                  <div className="panel overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead className="border-b border-ink-100 text-ink-700/70">
                        <tr>
                          <th className="px-4 py-3 font-medium">Student</th>
                          <th className="px-4 py-3 font-medium">Admission</th>
                          <th className="px-4 py-3 font-medium">Marks / {maxMarks}</th>
                          <th className="px-4 py-3 font-medium">Absent</th>
                        </tr>
                      </thead>
                      <tbody>
                        {records.map((record) => {
                          const row = draft[record.studentId] ?? {
                            marksObtained: '',
                            isAbsent: false,
                          };
                          return (
                            <tr key={record.studentId} className="border-b border-ink-50">
                              <td className="px-4 py-3 font-medium text-ink-950">
                                {record.fullName}
                              </td>
                              <td className="px-4 py-3 text-ink-700">{record.admissionNo}</td>
                              <td className="px-4 py-3">
                                <Input
                                  type="number"
                                  min={0}
                                  max={maxMarks}
                                  disabled={readOnly || !canEnterMarks || row.isAbsent}
                                  value={row.isAbsent ? '' : row.marksObtained}
                                  onChange={(event) =>
                                    setDraft((current) => ({
                                      ...current,
                                      [record.studentId]: {
                                        ...row,
                                        marksObtained: event.target.value,
                                        isAbsent: false,
                                      },
                                    }))
                                  }
                                  className="max-w-[8rem]"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  type="checkbox"
                                  disabled={readOnly || !canEnterMarks}
                                  checked={row.isAbsent}
                                  onChange={(event) =>
                                    setDraft((current) => ({
                                      ...current,
                                      [record.studentId]: {
                                        marksObtained: event.target.checked
                                          ? ''
                                          : row.marksObtained,
                                        isAbsent: event.target.checked,
                                      },
                                    }))
                                  }
                                  aria-label={`Mark ${record.fullName} absent`}
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        ) : resultsQuery.isPending ? (
          <div className="panel">
            <PageLoader compact />
          </div>
        ) : resultsQuery.error ? (
          <section className="rounded-2xl border border-red-200 bg-white p-8 text-center">
            <h2 className="font-semibold text-ink-950">Failed to load results</h2>
            <p className="mt-2 text-sm text-ink-700">{resultsQuery.error.message}</p>
          </section>
        ) : (resultsQuery.data?.results.length ?? 0) === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No results yet"
            description="Enter marks to see student totals."
          />
        ) : (
          <div className="panel overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-ink-100 text-ink-700/70">
                <tr>
                  <th className="px-4 py-3 font-medium">Student</th>
                  <th className="px-4 py-3 font-medium">Section</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">%</th>
                </tr>
              </thead>
              <tbody>
                {resultsQuery.data?.results.map((row) => (
                  <tr key={row.studentId} className="border-b border-ink-50">
                    <td className="px-4 py-3 font-medium text-ink-950">
                      {row.fullName}
                      <span className="mt-0.5 block text-xs text-ink-700/60">
                        {row.admissionNo}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink-700">{row.sectionName}</td>
                    <td className="px-4 py-3 text-ink-700">
                      {row.totalObtained} / {row.totalMax}
                    </td>
                    <td className="px-4 py-3 font-medium text-ink-950">{row.percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmPublish}
        title="Publish results?"
        description="Marks will become read-only once results are published."
        confirmLabel="Publish results"
        variant="default"
        loading={publishExam.isPending}
        onClose={() => setConfirmPublish(false)}
        onConfirm={() =>
          publishExam.mutate(exam.id, { onSettled: () => setConfirmPublish(false) })
        }
      />
    </AppLayout>
  );
}
