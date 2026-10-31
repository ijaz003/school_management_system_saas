import { useState, type ReactNode } from 'react';
import { ArrowLeft, BookOpen, Plus, Users } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { PageLoader } from '@/components/ui/spinner';
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
  const { can } = usePermission();
  const classQuery = useClass(id);
  const sectionsQuery = useSections(id);
  const subjectsQuery = useSubjects();
  const addSubjects = useAddSubjects();
  const deleteSection = useDeleteSection(id);

  if (classQuery.isPending) return <AppLayout><div className="rounded-xl border border-gray-200 bg-white p-12"><PageLoader /></div></AppLayout>;
  if (classQuery.error || !classQuery.data) return <AppLayout><section className="rounded-xl border border-red-200 bg-white p-8"><h1 className="font-semibold text-gray-900">Unable to load class</h1><p className="mt-2 text-sm text-gray-600">{classQuery.error?.message ?? 'The class could not be found.'}</p><Link className="mt-4 inline-flex text-sm font-medium text-blue-600 hover:underline" to="/settings/classes">Back to classes</Link></section></AppLayout>;

  const cls = classQuery.data;
  const sections = sectionsQuery.data ?? [];
  const subjectOptions = (subjectsQuery.data ?? []).filter((subject) => !cls.subjects.some((current) => current.id === subject.id));
  const handleDelete = (sectionId: string, fullName: string) => {
    if (window.confirm(`Delete section "${fullName}"? This cannot be undone.`)) deleteSection.mutate(sectionId);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <Link to="/settings/classes" className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600"><ArrowLeft className="h-4 w-4" aria-hidden="true" />All classes</Link>
        <header className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-gray-200 bg-white p-6">
          <div><div className="flex flex-wrap items-center gap-3"><h1 className="text-2xl font-bold text-gray-900">{cls.name}</h1><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">Level {cls.order}</span><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${cls.type === 'streamed' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>{cls.type === 'streamed' ? 'Streamed' : 'Common curriculum'}</span></div>{cls.description && <p className="mt-2 max-w-2xl text-sm text-gray-600">{cls.description}</p>}</div>
          {can('classes.create') && <Button onClick={() => setAddingSection(true)}><Plus className="h-4 w-4" aria-hidden="true" />Add section</Button>}
        </header>
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="Sections" value={sections.length} icon={<Users className="h-5 w-5" />} />
          <Stat label="Class subjects" value={cls.subjects.length} icon={<BookOpen className="h-5 w-5" />} />
          <Stat label="Curriculum" value={cls.type === 'streamed' ? 'Streamed' : 'Common'} />
        </div>
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <header className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold text-gray-900">Class subjects</h2><p className="mt-1 text-sm text-gray-500">Subjects available to sections that share the class curriculum.</p></div>{can('classes.update') && <Button variant="outline" onClick={() => setAddingSubjects(true)}><Plus className="h-4 w-4" aria-hidden="true" />Add subjects</Button>}</header>
          {cls.subjects.length > 0 ? <div className="mt-4 flex flex-wrap gap-2">{cls.subjects.map((subject) => <span key={subject.id} className="rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-700">{subject.name} <span className="ml-1 text-xs text-gray-500">{subject.code}</span></span>)}</div> : <p className="mt-4 rounded-lg bg-gray-50 p-4 text-sm text-gray-500">No subjects assigned yet.</p>}
          {addingSubjects && <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50/40 p-4"><h3 className="font-medium text-gray-900">Choose subjects to add</h3>{subjectsQuery.isPending ? <p className="mt-3 text-sm text-gray-500">Loading subjects...</p> : subjectsQuery.error ? <p role="alert" className="mt-3 text-sm text-red-600">Could not load subjects: {subjectsQuery.error.message}</p> : subjectOptions.length === 0 ? <p className="mt-3 text-sm text-gray-500">Every catalogue subject is already assigned to this class.</p> : <div className="mt-3 grid max-h-52 gap-2 overflow-y-auto sm:grid-cols-2">{subjectOptions.map((subject) => <label key={subject.id} className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white p-3"><input type="checkbox" checked={selectedSubjects.includes(subject.id)} onChange={() => setSelectedSubjects((current) => current.includes(subject.id) ? current.filter((item) => item !== subject.id) : [...current, subject.id])} className="h-4 w-4 rounded text-blue-600" /><span className="text-sm text-gray-800">{subject.name} <span className="text-xs text-gray-500">{subject.code}</span></span></label>)}</div>}
            <div className="mt-4 flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => { setAddingSubjects(false); setSelectedSubjects([]); }}>Cancel</Button><Button type="button" disabled={selectedSubjects.length === 0 || addSubjects.isPending} isLoading={addSubjects.isPending} onClick={() => addSubjects.mutate({ classId: cls.id, subjectIds: selectedSubjects }, { onSuccess: () => { setSelectedSubjects([]); setAddingSubjects(false); } })}>Add selected</Button></div>
          </div>}
        </section>
        <section className="space-y-4">
          <header className="flex items-center justify-between"><div><h2 className="text-lg font-semibold text-gray-900">Sections</h2><p className="mt-1 text-sm text-gray-500">Manage the sections within {cls.name}.</p></div>{can('classes.create') && <Button variant="outline" onClick={() => setAddingSection(true)}><Plus className="h-4 w-4" aria-hidden="true" />Add section</Button>}</header>
          {sectionsQuery.isPending ? <div className="rounded-xl border border-gray-200 bg-white p-8"><PageLoader /></div> : sectionsQuery.error ? <section className="rounded-xl border border-red-200 bg-white p-6"><p className="text-sm text-red-700">Failed to load sections: {sectionsQuery.error.message}</p><Button className="mt-3" variant="outline" onClick={() => void sectionsQuery.refetch()} isLoading={sectionsQuery.isFetching}>Try again</Button></section> : sections.length === 0 ? <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center"><Users className="mx-auto h-9 w-9 text-gray-300" aria-hidden="true" /><p className="mt-3 font-medium text-gray-900">No sections yet</p><p className="mt-1 text-sm text-gray-500">Add a section to organize students and curriculum.</p></div> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{sections.map((section) => <SectionCard key={section.id} section={section} deleting={deleteSection.isPending} onDelete={can('classes.delete') ? () => handleDelete(section.id, section.fullName) : undefined} />)}</div>}
        </section>
        {addingSection && <CreateSectionModal classId={cls.id} onClose={() => setAddingSection(false)} />}
      </div>
    </AppLayout>
  );
}

function Stat({ label, value, icon }: { label: string; value: number | string; icon?: ReactNode }) {
  return <section className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-5"><span className="text-blue-600">{icon}</span><div><p className="text-sm text-gray-500">{label}</p><p className="text-xl font-bold text-gray-900">{value}</p></div></section>;
}
