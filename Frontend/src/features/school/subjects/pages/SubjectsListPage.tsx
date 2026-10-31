import { useState } from 'react';
import { BookOpen, CheckCircle2, Library, Plus, Search, Sparkles, Trash2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { PageHeader } from '@/components/ui/page-header';
import { TableSkeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/ui/stat-card';
import { usePermission } from '@/hooks/usePermission';
import { SubjectForm } from '../components/SubjectForm';
import { useDeleteSubject } from '../hooks/useDeleteSubject';
import { useSubjects, type Subject } from '../hooks/useSubjects';

export function SubjectsListPage() {
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<Subject | null>(null);
  const { can } = usePermission();
  const query = useSubjects();
  const remove = useDeleteSubject();
  const allSubjects = query.data ?? [];
  const subjects = allSubjects.filter((subject) =>
    `${subject.name} ${subject.code}`.toLowerCase().includes(search.toLowerCase()),
  );
  const coreCount = allSubjects.filter((subject) => !subject.isElective).length;
  const electiveCount = allSubjects.length - coreCount;
  const inUseCount = allSubjects.filter(
    (subject) => subject.usedInClasses + subject.usedInSections > 0,
  ).length;

  const handleDelete = (subject: Subject) => {
    if (subject.usedInClasses + subject.usedInSections > 0) return;
    setToDelete(subject);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Academic"
          title="Subjects"
          description="Manage the subject catalogue for your school."
          actions={
            can('classes.create') ? (
              <Button onClick={() => setCreating(true)}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add subject
              </Button>
            ) : undefined
          }
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total subjects" value={allSubjects.length} icon={BookOpen} loading={query.isPending} />
          <StatCard label="Core subjects" value={coreCount} icon={Library} loading={query.isPending} />
          <StatCard label="Elective subjects" value={electiveCount} icon={Sparkles} loading={query.isPending} />
          <StatCard label="In use" value={inUseCount} icon={CheckCircle2} loading={query.isPending} />
        </div>

        <section className="panel p-4">
          <label htmlFor="subject-search" className="sr-only">
            Search subjects
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
              aria-hidden="true"
            />
            <Input
              id="subject-search"
              type="search"
              className="pl-10"
              placeholder="Search by subject name or code..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </section>

        {query.isPending ? (
          <TableSkeleton rows={6} />
        ) : query.error ? (
          <section className="panel border-danger-100 p-8 text-center">
            <h2 className="font-display font-semibold text-ink-950">Failed to load subjects</h2>
            <p className="mt-2 text-sm text-ink-600">{query.error.message}</p>
            <Button
              className="mt-4"
              variant="outline"
              onClick={() => void query.refetch()}
              isLoading={query.isFetching}
            >
              Try again
            </Button>
          </section>
        ) : subjects.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title={search ? 'No matching subjects' : 'No subjects yet'}
            description={
              search ? 'Try another name or code.' : 'Create a subject to start building class curricula.'
            }
          />
        ) : (
          <section className="panel overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="sticky top-0 border-b border-ink-100 bg-ink-50 text-xs uppercase tracking-wide text-ink-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold sm:px-5">Subject</th>
                    <th className="px-4 py-3 font-semibold sm:px-5">Code</th>
                    <th className="px-4 py-3 font-semibold sm:px-5">Type</th>
                    <th className="px-4 py-3 font-semibold sm:px-5">Usage</th>
                    <th className="px-4 py-3 text-right font-semibold sm:px-5">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {subjects.map((subject) => {
                    const inUse = subject.usedInClasses + subject.usedInSections > 0;
                    return (
                      <tr key={subject.id} className="transition hover:bg-ink-50">
                        <td className="px-4 py-4 sm:px-5">
                          <div className="font-medium text-ink-950">{subject.name}</div>
                          {subject.description && (
                            <p className="mt-0.5 max-w-sm truncate text-xs text-ink-500">
                              {subject.description}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-4 sm:px-5">
                          <code className="rounded bg-ink-100 px-2 py-1 font-mono text-xs text-ink-700">
                            {subject.code}
                          </code>
                        </td>
                        <td className="px-4 py-4 sm:px-5">
                          <Badge tone={subject.isElective ? 'warning' : 'primary'}>
                            {subject.isElective ? 'Elective' : 'Core'}
                          </Badge>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-ink-600 sm:px-5">
                          {subject.usedInClasses} classes · {subject.usedInSections} sections
                        </td>
                        <td className="px-4 py-4 text-right sm:px-5">
                          {can('classes.delete') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              aria-label={`Delete ${subject.name}`}
                              title={
                                inUse
                                  ? 'Remove the subject from classes and sections before deleting.'
                                  : 'Delete subject'
                              }
                              disabled={inUse || remove.isPending}
                              onClick={() => handleDelete(subject)}
                            >
                              <Trash2 className="h-4 w-4 text-danger-600" aria-hidden="true" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {creating && (
          <Modal
            onClose={() => setCreating(false)}
            title="Add subject"
            description="Add a subject to the school catalogue."
            size="lg"
          >
            <SubjectForm onSuccess={() => setCreating(false)} onCancel={() => setCreating(false)} />
          </Modal>
        )}

        <ConfirmDialog
          open={toDelete !== null}
          title="Delete subject"
          description={toDelete ? `Delete subject "${toDelete.name}"?` : ''}
          confirmLabel="Delete"
          loading={remove.isPending}
          onClose={() => setToDelete(null)}
          onConfirm={() => {
            if (!toDelete) return;
            remove.mutate(toDelete.id, { onSettled: () => setToDelete(null) });
          }}
        />
      </div>
    </AppLayout>
  );
}
