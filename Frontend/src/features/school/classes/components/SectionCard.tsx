import { BookOpen, Layers3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { RowActions } from '@/components/ui/row-actions';
import type { ClassSection } from '../hooks/useClass';

export function SectionCard({
  section,
  onDelete,
  deleting = false,
}: {
  section: ClassSection;
  onDelete?: () => void;
  deleting?: boolean;
}) {
  const custom = !section.useClassSubjects;
  return (
    <article
      className={`panel border-l-4 p-5 ${custom ? 'border-l-warning-700' : 'border-l-primary-600'}`}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display font-semibold text-ink-950">{section.fullName}</h3>
          <p className="mt-1 text-sm text-ink-500">{section.stream || 'General section'}</p>
        </div>
        <Badge tone={custom ? 'warning' : 'success'} className="shrink-0">
          {custom ? 'Custom subjects' : 'Same as class'}
        </Badge>
      </header>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-600">
        <span className="inline-flex items-center gap-2">
          <Layers3 className="h-4 w-4" aria-hidden="true" />
          Capacity {section.capacity}
        </span>
        <span className="inline-flex items-center gap-2">
          <BookOpen className="h-4 w-4" aria-hidden="true" />
          {section.subjects.length} subjects
        </span>
      </div>
      {section.subjects.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {section.subjects.map((subject) => (
            <span key={subject.id} className="rounded-md bg-ink-100 px-2 py-1 text-xs text-ink-700">
              {subject.name}
            </span>
          ))}
        </div>
      )}
      {onDelete && (
        <div className="mt-4 border-t border-ink-100 pt-3">
          <RowActions
            onDelete={onDelete}
            deleteLabel={`Delete ${section.fullName}`}
            disabled={deleting}
          />
        </div>
      )}
    </article>
  );
}
