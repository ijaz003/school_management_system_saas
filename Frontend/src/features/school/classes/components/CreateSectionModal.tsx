import { useState } from 'react';
import { BookOpen, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSubjects } from '@/features/school/subjects/hooks/useSubjects';
import { useCreateSection } from '../hooks/useCreateSection';
import { useClass } from '../hooks/useClass';

const STREAMS = ['', 'Science', 'Commerce', 'Arts', 'Pre-Medical', 'Pre-Engineering'];

export function CreateSectionModal({ classId, onClose }: { classId: string; onClose: () => void }) {
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState('40');
  const [stream, setStream] = useState('');
  const [shared, setShared] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [formError, setFormError] = useState('');
  const classQuery = useClass(classId);
  const subjectsQuery = useSubjects();
  const createSection = useCreateSection();
  const subjects = subjectsQuery.data ?? [];
  const filtered = subjects.filter((subject) => `${subject.name} ${subject.code}`.toLowerCase().includes(search.toLowerCase()));

  const submit = () => {
    if (!name.trim()) {
      setFormError('Enter a section name.');
      return;
    }
    if (!shared && selected.length === 0) {
      setFormError('Select at least one subject for a custom section.');
      return;
    }
    const parsedCapacity = Number(capacity);
    if (!Number.isInteger(parsedCapacity) || parsedCapacity < 1 || parsedCapacity > 200) {
      setFormError('Capacity must be between 1 and 200.');
      return;
    }
    setFormError('');
    createSection.mutate({
      classId,
      name: name.trim(),
      capacity: parsedCapacity,
      ...(stream ? { stream } : {}),
      useClassSubjects: shared,
      ...(!shared ? { subjectIds: selected } : {}),
    }, { onSuccess: onClose });
  };

  const toggleSubject = (id: string) => {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
    setFormError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="create-section-title" className="my-6 w-full max-w-3xl rounded-2xl bg-white shadow-xl">
        <header className="flex items-start justify-between border-b border-gray-200 p-5">
          <div><h2 id="create-section-title" className="text-xl font-bold text-gray-900">Add section</h2><p className="mt-1 text-sm text-gray-500">{classQuery.data?.name ?? 'Class'} · Choose how this section gets its subjects.</p></div>
          <Button type="button" variant="ghost" size="sm" aria-label="Close" onClick={onClose}><X className="h-5 w-5" aria-hidden="true" /></Button>
        </header>
        <div className="space-y-5 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Section name *" placeholder="e.g. A" maxLength={20} value={name} onChange={(event) => setName(event.target.value)} />
            <Input label="Capacity" type="number" min={1} max={200} value={capacity} onChange={(event) => setCapacity(event.target.value)} />
          </div>
          <div>
            <label htmlFor="section-stream" className="mb-1.5 block text-sm font-medium text-gray-700">Stream / group (optional)</label>
            <select id="section-stream" value={stream} onChange={(event) => setStream(event.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {STREAMS.map((item) => <option key={item || 'none'} value={item}>{item || 'None (general)'}</option>)}
            </select>
          </div>
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-gray-700">Subject setup</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <button type="button" aria-pressed={shared} onClick={() => { setShared(true); setFormError(''); }} className={`rounded-xl border-2 p-4 text-left ${shared ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                <span className="block font-semibold text-gray-900">Same as class</span><span className="mt-1 block text-xs text-gray-600">Inherit all subjects assigned to this class.</span>
              </button>
              <button type="button" aria-pressed={!shared} onClick={() => { setShared(false); setFormError(''); }} className={`rounded-xl border-2 p-4 text-left ${!shared ? 'border-purple-500 bg-purple-50' : 'border-gray-200'}`}>
                <span className="block font-semibold text-gray-900">Custom subjects</span><span className="mt-1 block text-xs text-gray-600">Choose a section-specific subject list.</span>
              </button>
            </div>
          </fieldset>
          {!shared && (
            <section className="rounded-xl border border-gray-200">
              <div className="border-b border-gray-200 p-3">
                <label htmlFor="section-subject-search" className="sr-only">Search subjects</label>
                <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" /><Input id="section-subject-search" className="pl-10" placeholder="Search subjects..." value={search} onChange={(event) => setSearch(event.target.value)} /></div>
                {subjectsQuery.error && <p className="mt-2 text-sm text-red-600">Could not load subjects: {subjectsQuery.error.message}</p>}
              </div>
              {subjectsQuery.isPending ? <p className="p-5 text-sm text-gray-500">Loading subjects...</p> : subjectsQuery.data?.length === 0 ? <p className="p-5 text-sm text-gray-500">Create subjects first, then set up a custom section.</p> : (
                <div className="grid max-h-56 gap-2 overflow-y-auto p-3 sm:grid-cols-2">
                  {filtered.map((subject) => <label key={subject.id} className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 ${selected.includes(subject.id) ? 'border-blue-200 bg-blue-50' : 'border-gray-100'}`}><input type="checkbox" checked={selected.includes(subject.id)} onChange={() => toggleSubject(subject.id)} className="h-4 w-4 rounded text-blue-600" /><BookOpen className="h-4 w-4 text-gray-400" aria-hidden="true" /><span className="min-w-0"><span className="block text-sm font-medium text-gray-800">{subject.name}</span><span className="block text-xs text-gray-500">{subject.code}</span></span></label>)}
                  {filtered.length === 0 && <p className="p-3 text-sm text-gray-500 sm:col-span-2">No subjects match your search.</p>}
                </div>
              )}
              <p className="border-t border-gray-100 px-3 py-2 text-xs text-gray-500">{selected.length} subject(s) selected</p>
            </section>
          )}
          {formError && <p role="alert" className="text-sm text-red-600">{formError}</p>}
        </div>
        <footer className="flex justify-end gap-3 border-t border-gray-200 p-5">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="button" onClick={submit} isLoading={createSection.isPending} disabled={createSection.isPending || (!shared && Boolean(subjectsQuery.error))}>Create section</Button>
        </footer>
      </section>
    </div>
  );
}
