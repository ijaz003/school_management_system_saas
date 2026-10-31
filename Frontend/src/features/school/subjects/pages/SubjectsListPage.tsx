import { useState, type ReactNode } from 'react';
import { BookOpen, Plus, Search, Trash2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageLoader } from '@/components/ui/spinner';
import { usePermission } from '@/hooks/usePermission';
import { SubjectForm } from '../components/SubjectForm';
import { useDeleteSubject } from '../hooks/useDeleteSubject';
import { useSubjects, type Subject } from '../hooks/useSubjects';

export function SubjectsListPage() {
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const { can } = usePermission();
  const query = useSubjects();
  const remove = useDeleteSubject();
  const allSubjects = query.data ?? [];
  const subjects = allSubjects.filter((subject) => `${subject.name} ${subject.code}`.toLowerCase().includes(search.toLowerCase()));
  const coreCount = allSubjects.filter((subject) => !subject.isElective).length;
  const electiveCount = allSubjects.length - coreCount;

  const handleDelete = (subject: Subject) => {
    if (subject.usedInClasses + subject.usedInSections > 0) return;
    if (window.confirm(`Delete subject "${subject.name}"?`)) remove.mutate(subject.id);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div><h1 className="text-2xl font-bold text-gray-900">Subjects</h1><p className="mt-1 text-sm text-gray-500">Manage the subject catalogue for your school.</p></div>
          {can('classes.create') && <Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" aria-hidden="true" />Add subject</Button>}
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Total subjects" value={allSubjects.length} icon={<BookOpen className="h-5 w-5" />} />
          <Stat label="Core subjects" value={coreCount} />
          <Stat label="Elective subjects" value={electiveCount} />
          <Stat label="In use" value={allSubjects.filter((subject) => subject.usedInClasses + subject.usedInSections > 0).length} />
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <label htmlFor="subject-search" className="sr-only">Search subjects</label>
          <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" /><Input id="subject-search" type="search" className="pl-10" placeholder="Search by subject name or code..." value={search} onChange={(event) => setSearch(event.target.value)} /></div>
        </div>

        {query.isPending ? (
          <div className="rounded-xl border border-gray-200 bg-white p-12"><PageLoader /></div>
        ) : query.error ? (
          <section className="rounded-xl border border-red-200 bg-white p-8 text-center">
            <h2 className="font-semibold text-gray-900">Failed to load subjects</h2><p className="mt-2 text-sm text-gray-600">{query.error.message}</p>
            <Button className="mt-4" variant="outline" onClick={() => void query.refetch()} isLoading={query.isFetching}>Try again</Button>
          </section>
        ) : subjects.length === 0 ? (
          <section className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
            <BookOpen className="mx-auto h-10 w-10 text-gray-300" aria-hidden="true" />
            <h2 className="mt-3 font-semibold text-gray-900">{search ? 'No matching subjects' : 'No subjects yet'}</h2>
            <p className="mt-1 text-sm text-gray-500">{search ? 'Try another name or code.' : 'Create a subject to start building class curricula.'}</p>
          </section>
        ) : (
          <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
                  <tr><th className="px-5 py-3 font-semibold">Subject</th><th className="px-5 py-3 font-semibold">Code</th><th className="px-5 py-3 font-semibold">Type</th><th className="px-5 py-3 font-semibold">Usage</th><th className="px-5 py-3 text-right font-semibold">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {subjects.map((subject) => {
                    const inUse = subject.usedInClasses + subject.usedInSections > 0;
                    return (
                      <tr key={subject.id} className="hover:bg-gray-50">
                        <td className="px-5 py-4"><div className="font-medium text-gray-900">{subject.name}</div>{subject.description && <p className="mt-0.5 max-w-sm truncate text-xs text-gray-500">{subject.description}</p>}</td>
                        <td className="px-5 py-4"><code className="rounded bg-gray-100 px-2 py-1 font-mono text-xs">{subject.code}</code></td>
                        <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${subject.isElective ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{subject.isElective ? 'Elective' : 'Core'}</span></td>
                        <td className="px-5 py-4 text-sm text-gray-600">{subject.usedInClasses} classes · {subject.usedInSections} sections</td>
                        <td className="px-5 py-4 text-right">
                          {can('classes.delete') && <Button variant="ghost" size="sm" aria-label={`Delete ${subject.name}`} title={inUse ? 'Remove the subject from classes and sections before deleting.' : 'Delete subject'} disabled={inUse || remove.isPending} onClick={() => handleDelete(subject)}><Trash2 className="h-4 w-4 text-red-600" aria-hidden="true" /></Button>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {creating && <Modal title="Add subject" onClose={() => setCreating(false)}><SubjectForm onSuccess={() => setCreating(false)} onCancel={() => setCreating(false)} /></Modal>}
      </div>
    </AppLayout>
  );
}

function Stat({ label, value, icon }: { label: string; value: number; icon?: ReactNode }) {
  return <section className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-5"><span className="text-blue-600">{icon}</span><div><p className="text-sm text-gray-500">{label}</p><p className="text-xl font-bold text-gray-900">{value}</p></div></section>;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4" role="presentation"><section role="dialog" aria-modal="true" aria-labelledby="subject-modal-title" className="my-8 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl"><header className="mb-5 flex items-center justify-between"><h2 id="subject-modal-title" className="text-xl font-bold text-gray-900">{title}</h2><Button type="button" variant="ghost" onClick={onClose} aria-label="Close">×</Button></header>{children}</section></div>;
}
