import { BookOpen, Layers3, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ClassSection } from '../hooks/useClass';

export function SectionCard({ section, onDelete, deleting = false }: { section: ClassSection; onDelete?: () => void; deleting?: boolean }) {
  const custom = !section.useClassSubjects;
  return (
    <article className={`rounded-xl border border-gray-200 border-l-4 bg-white p-5 ${custom ? 'border-l-purple-500' : 'border-l-green-500'}`}>
      <header className="flex items-start justify-between gap-3">
        <div><h3 className="font-semibold text-gray-900">{section.fullName}</h3><p className="mt-1 text-sm text-gray-500">{section.stream || 'General section'}</p></div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${custom ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>{custom ? 'Custom subjects' : 'Same as class'}</span>
      </header>
      <div className="mt-4 flex gap-5 text-sm text-gray-600">
        <span className="inline-flex items-center gap-2"><Layers3 className="h-4 w-4" aria-hidden="true" />Capacity {section.capacity}</span>
        <span className="inline-flex items-center gap-2"><BookOpen className="h-4 w-4" aria-hidden="true" />{section.subjects.length} subjects</span>
      </div>
      {section.subjects.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{section.subjects.map((subject) => <span key={subject.id} className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-700">{subject.name}</span>)}</div>}
      {onDelete && <div className="mt-4 flex justify-end border-t border-gray-100 pt-3"><Button type="button" variant="ghost" size="sm" onClick={onDelete} isLoading={deleting} aria-label={`Delete ${section.fullName}`}><Trash2 className="h-4 w-4 text-red-600" aria-hidden="true" />Delete section</Button></div>}
    </article>
  );
}
