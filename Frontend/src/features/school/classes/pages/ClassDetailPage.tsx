import { useState } from 'react';
import { ArrowLeft, BookOpen, Layers3, Plus, Users } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { PageLoader } from '@/components/ui/spinner';
import { StatCard } from '@/components/ui/stat-card';
import { usePermission } from '@/hooks/usePermission';
import { useSubjects } from '@/features/school/subjects/hooks/useSubjects';
import { SectionCard } from '../components/SectionCard';
import { CreateSectionModal } from '../components/CreateSectionModal';
import { useAddSubjects } from '../hooks/useAddSubjects';
import { useClass } from '../hooks/useClass';
import { useDeleteSection } from '../hooks/useDeleteSection';
import { useSections } from '../hooks/useSections';

export function ClassDetailPage() {
  const { id = '' } = useParams();
  const [addingSection, setAddingSection] = useState(false);
  const [addingSubjects, setAddingSubjects] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [sectionToDelete, setSectionToDelete] = useState<{ id: string; fullName: string } | null>(null);
  const { can } = usePermission();
  const classQuery = useClass(id);
  const sectionsQuery = useSections(id);
  const subjectsQuery = useSubjects();
  const addSubjects = useAddSubjects();
  const deleteSection = useDeleteSection(id);

  if (classQuery.isPending) {
    return (
      <AppLayout>
        <div className="panel">
          <PageLoader compact />
        </div>
      </AppLayout>
    );
  }

  if (classQuery.error || !classQuery.data) {
    return (
      <AppLayout>
        <section className="panel border-danger-100 p-8">
          <h1 className="font-display font-semibold text-ink-950">Unable to load class</h1>
          <p className="mt-2 text-sm text-ink-600">
            {classQuery.error?.message ?? 'The class could not be found.'}
          </p>
          <Link
            className="mt-4 inline-flex text-sm font-medium text-primary-700 hover:underline"
            to="/settings/classes"
          >
            Back to classes
          </Link>
        </section>
      </AppLayout>
    );
  }

  const cls = classQuery.data;
  const sections = sectionsQuery.data ?? [];
  const subjectOptions = (subjectsQuery.data ?? []).filter(
    (subject) => !cls.subjects.some((current) => current.id === subject.id),
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <Link
          to="/settings/classes"
          className="inline-flex items-center gap-2 text-sm font-medium text-ink-600 hover:text-primary-700"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          All classes
        </Link>

        <section className="panel p-4 sm:p-6">
          <PageHeader
            eyebrow="Class"
            title={cls.name}
            description={cls.description ?? undefined}
            actions={
              can('classes.create') ? (
                <Button onClick={() => setAddingSection(true)}>
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Add section
                </Button>
              ) : undefined
            }
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone="primary">Level {cls.order}</Badge>
            <Badge tone={cls.type === 'streamed' ? 'warning' : 'success'}>
              {cls.type === 'streamed' ? 'Streamed' : 'Common curriculum'}
            </Badge>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Sections" value={sections.length} icon={Users} />
          <StatCard label="Class subjects" value={cls.subjects.length} icon={BookOpen} />
          <StatCard
            label="Curriculum"
            value={cls.type === 'streamed' ? 'Streamed' : 'Common'}
            icon={Layers3}
          />
        </div>

        <section className="panel p-4 sm:p-5">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display font-semibold text-ink-950">Class subjects</h2>
              <p className="mt-1 text-sm text-ink-500">
                Subjects available to sections that share the class curriculum.
              </p>
            </div>
            {can('classes.update') && (
              <Button variant="outline" onClick={() => setAddingSubjects(true)}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add subjects
              </Button>
            )}
          </header>

          {cls.subjects.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {cls.subjects.map((subject) => (
                <span
                  key={subject.id}
                  className="rounded-lg bg-ink-100 px-3 py-2 text-sm text-ink-700"
                >
                  {subject.name}
                  <span className="ml-1 text-xs text-ink-500">{subject.code}</span>
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-4 rounded-xl bg-ink-50 p-4 text-sm text-ink-500">
              No subjects assigned yet.
            </p>
          )}

          {addingSubjects && (
            <div className="mt-5 rounded-xl border border-primary-100 bg-primary-50/40 p-4">
              <h3 className="font-medium text-ink-950">Choose subjects to add</h3>
              {subjectsQuery.isPending ? (
                <p className="mt-3 text-sm text-ink-500">Loading subjects...</p>
              ) : subjectsQuery.error ? (
                <p role="alert" className="mt-3 text-sm text-danger-600">
                  Could not load subjects: {subjectsQuery.error.message}
                </p>
              ) : subjectOptions.length === 0 ? (
                <p className="mt-3 text-sm text-ink-500">
                  Every catalogue subject is already assigned to this class.
                </p>
              ) : (
                <div className="mt-3 grid max-h-52 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
                  {subjectOptions.map((subject) => (
                    <label
                      key={subject.id}
                      className="flex cursor-pointer items-center gap-2 rounded-xl border border-ink-200 bg-white p-3"
                    >
                      <input
                        type="checkbox"
                        checked={selectedSubjects.includes(subject.id)}
                        onChange={() =>
                          setSelectedSubjects((current) =>
                            current.includes(subject.id)
                              ? current.filter((item) => item !== subject.id)
                              : [...current, subject.id],
                          )
                        }
                        className="h-4 w-4 rounded accent-primary-700"
                      />
                      <span className="text-sm text-ink-800">
                        {subject.name}{' '}
                        <span className="text-xs text-ink-500">{subject.code}</span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
              <div className="mt-4 flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setAddingSubjects(false);
                    setSelectedSubjects([]);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={selectedSubjects.length === 0 || addSubjects.isPending}
                  isLoading={addSubjects.isPending}
                  onClick={() =>
                    addSubjects.mutate(
                      { classId: cls.id, subjectIds: selectedSubjects },
                      {
                        onSuccess: () => {
                          setSelectedSubjects([]);
                          setAddingSubjects(false);
                        },
                      },
                    )
                  }
                >
                  Add selected
                </Button>
              </div>
            </div>
          )}
        </section>

        <section className="space-y-4">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold text-ink-950">Sections</h2>
              <p className="mt-1 text-sm text-ink-500">Manage the sections within {cls.name}.</p>
            </div>
            {can('classes.create') && (
              <Button variant="outline" onClick={() => setAddingSection(true)}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add section
              </Button>
            )}
          </header>

          {sectionsQuery.isPending ? (
            <div className="panel">
              <PageLoader compact />
            </div>
          ) : sectionsQuery.error ? (
            <section className="panel border-danger-100 p-6">
              <p className="text-sm text-danger-700">
                Failed to load sections: {sectionsQuery.error.message}
              </p>
              <Button
                className="mt-3"
                variant="outline"
                onClick={() => void sectionsQuery.refetch()}
                isLoading={sectionsQuery.isFetching}
              >
                Try again
              </Button>
            </section>
          ) : sections.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No sections yet"
              description="Add a section to organize students and curriculum."
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {sections.map((section) => (
                <SectionCard
                  key={section.id}
                  section={section}
                  deleting={deleteSection.isPending}
                  onDelete={
                    can('classes.delete')
                      ? () => setSectionToDelete({ id: section.id, fullName: section.fullName })
                      : undefined
                  }
                />
              ))}
            </div>
          )}
        </section>

        {addingSection && (
          <CreateSectionModal classId={cls.id} onClose={() => setAddingSection(false)} />
        )}

        <ConfirmDialog
          open={sectionToDelete !== null}
          title="Delete section"
          description={
            sectionToDelete
              ? `Delete section "${sectionToDelete.fullName}"? This cannot be undone.`
              : ''
          }
          confirmLabel="Delete"
          loading={deleteSection.isPending}
          onClose={() => setSectionToDelete(null)}
          onConfirm={() => {
            if (!sectionToDelete) return;
            deleteSection.mutate(sectionToDelete.id, { onSettled: () => setSectionToDelete(null) });
          }}
        />
      </div>
    </AppLayout>
  );
}
