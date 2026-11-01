import { useEffect, useMemo, useState } from 'react';
import { ArrowRightLeft, GraduationCap } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { PageLoader } from '@/components/ui/spinner';
import { useClasses } from '@/features/school/classes/hooks/useClasses';
import { usePermission } from '@/hooks/usePermission';
import {
  usePromoteStudents,
  usePromotionPreview,
  useSessionYears,
  type PromoteResult,
} from '../hooks/useSessionYears';

type Action = 'promote' | 'retain' | 'graduate';

export function PromoteStudentsPage() {
  const { can } = usePermission();
  const canPromote = can('students.promote') || can('students.update');
  const yearsQuery = useSessionYears({ enabled: canPromote });
  const classesQuery = useClasses();
  const promote = usePromoteStudents();

  const years = yearsQuery.data ?? [];
  const classes = classesQuery.data ?? [];

  const [fromSessionYearId, setFromSessionYearId] = useState('');
  const [toSessionYearId, setToSessionYearId] = useState('');
  const [fromClassId, setFromClassId] = useState('');
  const [toClassId, setToClassId] = useState('');
  const [actions, setActions] = useState<Record<string, Action>>({});
  const [sectionMap, setSectionMap] = useState<Record<string, string>>({});
  const [result, setResult] = useState<PromoteResult | null>(null);

  const previewQuery = usePromotionPreview(fromSessionYearId, fromClassId, toClassId || undefined);
  const preview = previewQuery.data;

  useEffect(() => {
    if (!years.length) return;
    const current = years.find((year) => year.isCurrent);
    if (!fromSessionYearId && current) setFromSessionYearId(current.id);
  }, [years, fromSessionYearId]);

  useEffect(() => {
    if (!preview) return;

    setActions((current) => {
      const nextActions: Record<string, Action> = {};
      for (const student of preview.students) {
        nextActions[student.id] =
          current[student.id] ??
          (preview.nextClass || preview.toSections.length > 0 ? 'promote' : 'graduate');
      }
      return nextActions;
    });

    setSectionMap((current) => {
      const nextMap: Record<string, string> = {};
      for (const fromSection of preview.fromSections) {
        if (current[fromSection.id] && preview.toSections.some((s) => s.id === current[fromSection.id])) {
          nextMap[fromSection.id] = current[fromSection.id]!;
          continue;
        }
        const match = preview.toSections.find(
          (section) =>
            section.name.trim().toLowerCase() === fromSection.name.trim().toLowerCase(),
        );
        if (match) nextMap[fromSection.id] = match.id;
        else if (preview.toSections[0]) nextMap[fromSection.id] = preview.toSections[0].id;
      }
      return nextMap;
    });
  }, [preview]);

  const selectedCount = useMemo(
    () => Object.values(actions).filter(Boolean).length,
    [actions],
  );

  if (!canPromote) {
    return (
      <AppLayout>
        <EmptyState
          title="No access"
          description="You need promote or student update permission."
        />
      </AppLayout>
    );
  }

  const runPromote = () => {
    if (!fromSessionYearId || !toSessionYearId || !fromClassId) return;
    const studentIds = Object.keys(actions);
    const retainStudentIds = studentIds.filter((id) => actions[id] === 'retain');
    const graduateStudentIds = studentIds.filter((id) => actions[id] === 'graduate');
    const destinationClassId = toClassId || preview?.nextClass?.id;

    promote.mutate(
      {
        fromSessionYearId,
        toSessionYearId,
        fromClassId,
        toClassId: destinationClassId,
        sectionMap,
        studentIds,
        retainStudentIds,
        graduateStudentIds,
      },
      {
        onSuccess: (data) => {
          setResult(data);
          void previewQuery.refetch();
        },
      },
    );
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Academic"
          title="Promote students"
          description="Move a class into the next session year. Previous placements stay in history."
        />

        <section className="panel grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="text-sm">
            <span className="mb-1.5 block font-medium text-ink-800">From session year</span>
            <select
              className="field-select"
              value={fromSessionYearId}
              onChange={(event) => {
                setFromSessionYearId(event.target.value);
                setResult(null);
              }}
            >
              <option value="">Select year</option>
              {years.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.name}
                  {year.isCurrent ? ' (current)' : ''}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1.5 block font-medium text-ink-800">To session year</span>
            <select
              className="field-select"
              value={toSessionYearId}
              onChange={(event) => {
                setToSessionYearId(event.target.value);
                setResult(null);
              }}
            >
              <option value="">Select year</option>
              {years
                .filter((year) => year.id !== fromSessionYearId)
                .map((year) => (
                  <option key={year.id} value={year.id}>
                    {year.name}
                  </option>
                ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1.5 block font-medium text-ink-800">From class</span>
            <select
              className="field-select"
              value={fromClassId}
              onChange={(event) => {
                setFromClassId(event.target.value);
                setToClassId('');
                setResult(null);
              }}
            >
              <option value="">Select class</option>
              {classes.map((klass) => (
                <option key={klass.id} value={klass.id}>
                  {klass.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1.5 block font-medium text-ink-800">To class</span>
            <select
              className="field-select"
              value={toClassId}
              onChange={(event) => setToClassId(event.target.value)}
              disabled={!preview}
            >
              <option value="">{preview?.nextClass ? 'Auto next class' : 'No next class (graduate/retain)'}</option>
              {classes
                .filter((klass) => klass.id !== fromClassId)
                .map((klass) => (
                  <option key={klass.id} value={klass.id}>
                    {klass.name}
                  </option>
                ))}
            </select>
          </label>
        </section>

        {fromClassId && fromSessionYearId && previewQuery.isPending ? (
          <div className="panel">
            <PageLoader compact />
          </div>
        ) : previewQuery.error ? (
          <section className="panel border-danger-100 p-6 text-sm text-danger-700">
            {previewQuery.error.message}
          </section>
        ) : preview && preview.students.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="No active students"
            description="This class has no active students to promote."
          />
        ) : preview ? (
          <>
            {(preview.fromSections.length > 0 && (toClassId || preview.nextClass)) && (
              <section className="panel p-4">
                <h2 className="mb-3 text-sm font-semibold text-ink-900">Section mapping</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {preview.fromSections.map((fromSection) => (
                    <label key={fromSection.id} className="text-sm">
                      <span className="mb-1.5 block text-ink-600">
                        {fromSection.name} →
                      </span>
                      <select
                        className="field-select"
                        value={sectionMap[fromSection.id] ?? ''}
                        onChange={(event) =>
                          setSectionMap((current) => ({
                            ...current,
                            [fromSection.id]: event.target.value,
                          }))
                        }
                      >
                        <option value="">Select target section</option>
                        {(preview.toSections.length
                          ? preview.toSections
                          : []
                        ).map((section) => (
                          <option key={section.id} value={section.id}>
                            {section.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
              </section>
            )}

            <section className="panel overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 px-4 py-3">
                <p className="text-sm text-ink-600">
                  {preview.students.length} student{preview.students.length === 1 ? '' : 's'}
                  {preview.nextClass ? (
                    <>
                      {' '}
                      · suggested next class{' '}
                      <span className="font-medium text-ink-900">{preview.nextClass.name}</span>
                    </>
                  ) : (
                    ' · no next class in ladder (use graduate or retain)'
                  )}
                </p>
                <Button
                  type="button"
                  disabled={
                    !toSessionYearId ||
                    selectedCount === 0 ||
                    promote.isPending ||
                    fromSessionYearId === toSessionYearId
                  }
                  isLoading={promote.isPending}
                  onClick={runPromote}
                >
                  <ArrowRightLeft className="h-4 w-4" aria-hidden="true" /> Run promotion
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-surface-muted/70 text-ink-500">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">Admission</th>
                      <th className="px-4 py-2.5 font-medium">Student</th>
                      <th className="px-4 py-2.5 font-medium">Section</th>
                      <th className="px-4 py-2.5 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.students.map((student) => (
                      <tr key={student.id} className="border-t border-ink-50">
                        <td className="px-4 py-2.5 font-mono text-xs text-ink-600">
                          {student.admissionNo}
                        </td>
                        <td className="px-4 py-2.5 font-medium text-ink-950">{student.fullName}</td>
                        <td className="px-4 py-2.5 text-ink-700">{student.sectionName}</td>
                        <td className="px-4 py-2.5">
                          <select
                            className="field-select max-w-[10rem]"
                            value={actions[student.id] ?? 'promote'}
                            onChange={(event) =>
                              setActions((current) => ({
                                ...current,
                                [student.id]: event.target.value as Action,
                              }))
                            }
                          >
                            <option value="promote" disabled={!toClassId && !preview.nextClass}>
                              Promote
                            </option>
                            <option value="retain">Retain</option>
                            <option value="graduate">Graduate</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        ) : (
          <EmptyState
            icon={ArrowRightLeft}
            title="Choose source year and class"
            description="Select from session year and class to preview students."
          />
        )}

        {result && (
          <section className="panel space-y-3 p-4 sm:p-5">
            <h2 className="font-display text-lg font-semibold text-ink-950">Promotion result</h2>
            <div className="flex flex-wrap gap-2">
              <Badge tone="success">Promoted {result.counts.promoted}</Badge>
              <Badge tone="warning">Retained {result.counts.retained}</Badge>
              <Badge tone="primary">Graduated {result.counts.graduated}</Badge>
              {result.counts.failed > 0 && (
                <Badge tone="danger">Failed {result.counts.failed}</Badge>
              )}
            </div>
            {result.errors.length > 0 && (
              <ul className="space-y-1 text-sm text-danger-700">
                {result.errors.map((error) => (
                  <li key={`${error.studentId}-${error.message}`}>
                    {error.admissionNo}: {error.message}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </AppLayout>
  );
}
