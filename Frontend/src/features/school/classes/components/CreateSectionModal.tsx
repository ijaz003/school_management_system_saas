import { useState } from 'react';
import { BookOpen, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
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
    <Modal
      title="Add section"
      description={`${classQuery.data?.name ?? 'Class'} · Choose how this section gets its subjects.`}
      size="lg"
      onClose={onClose}
      footer={(
        <>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="button" onClick={submit} isLoading={createSection.isPending} disabled={createSection.isPending || (!shared && Boolean(subjectsQuery.error))}>Create section</Button>
        </>
      )}
    >
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Section name *" placeholder="e.g. A" maxLength={20} value={name} onChange={(event) => setName(event.target.value)} />
          <Input label="Capacity" type="number" min={1} max={200} value={capacity} onChange={(event) => setCapacity(event.target.value)} />
        </div>
        <div>
          <label htmlFor="section-stream" className="mb-1.5 block text-sm font-medium text-ink-800">Stream / group (optional)</label>
          <select id="section-stream" value={stream} onChange={(event) => setStream(event.target.value)} className="field-select">
            {STREAMS.map((item) => <option key={item || 'none'} value={item}>{item || 'None (general)'}</option>)}
          </select>
        </div>
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-ink-800">Subject setup</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <button type="button" aria-pressed={shared} onClick={() => { setShared(true); setFormError(''); }} className={`rounded-xl border-2 p-4 text-left transition-colors ${shared ? 'border-primary-600 bg-primary-50' : 'border-ink-200 hover:border-ink-300'}`}>
              <span className="block font-semibold text-ink-950">Same as class</span><span className="mt-1 block text-xs text-ink-600">Inherit all subjects assigned to this class.</span>
            </button>
            <button type="button" aria-pressed={!shared} onClick={() => { setShared(false); setFormError(''); }} className={`rounded-xl border-2 p-4 text-left transition-colors ${!shared ? 'border-primary-600 bg-primary-50' : 'border-ink-200 hover:border-ink-300'}`}>
              <span className="block font-semibold text-ink-950">Custom subjects</span><span className="mt-1 block text-xs text-ink-600">Choose a section-specific subject list.</span>
            </button>
          </div>
        </fieldset>
        {!shared && (
          <section className="rounded-xl border border-ink-200">
            <div className="border-b border-ink-200 p-3">
              <label htmlFor="section-subject-search" className="sr-only">Search subjects</label>
              <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" aria-hidden="true" /><Input id="section-subject-search" className="pl-10" placeholder="Search subjects..." value={search} onChange={(event) => setSearch(event.target.value)} /></div>
              {subjectsQuery.error && <p className="mt-2 text-sm text-danger-600">Could not load subjects: {subjectsQuery.error.message}</p>}
            </div>
            {subjectsQuery.isPending ? <p className="p-5 text-sm text-ink-500">Loading subjects...</p> : subjectsQuery.data?.length === 0 ? <p className="p-5 text-sm text-ink-500">Create subjects first, then set up a custom section.</p> : (
              <div className="grid max-h-56 gap-2 overflow-y-auto p-3 sm:grid-cols-2">
                {filtered.map((subject) => <label key={subject.id} className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 ${selected.includes(subject.id) ? 'border-primary-200 bg-primary-50' : 'border-ink-100 hover:bg-ink-50'}`}><input type="checkbox" checked={selected.includes(subject.id)} onChange={() => toggleSubject(subject.id)} className="h-4 w-4 rounded border-ink-300 text-primary-700 focus:ring-primary-500" /><BookOpen className="h-4 w-4 text-ink-400" aria-hidden="true" /><span className="min-w-0"><span className="block text-sm font-medium text-ink-800">{subject.name}</span><span className="block text-xs text-ink-500">{subject.code}</span></span></label>)}
                {filtered.length === 0 && <p className="p-3 text-sm text-ink-500 sm:col-span-2">No subjects match your search.</p>}
              </div>
            )}
            <p className="border-t border-ink-100 px-3 py-2 text-xs text-ink-500">{selected.length} subject(s) selected</p>
          </section>
        )}
        {formError && <p role="alert" className="text-sm text-danger-600">{formError}</p>}
      </div>
    </Modal>
  );
}
