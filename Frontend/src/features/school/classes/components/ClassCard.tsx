import { ArrowUpRight, BookOpen, Layers3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import type { ClassItem } from '../hooks/useClasses';

export function ClassCard({ cls }: { cls: ClassItem }) {
  return (
    <Link
      to={`/settings/classes/${cls.id}`}
      className="panel group block p-5 transition hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-lift"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
          <BookOpen className="h-6 w-6" aria-hidden="true" />
        </span>
        <Badge tone={cls.type === 'streamed' ? 'warning' : 'success'}>
          {cls.type === 'streamed' ? 'Streamed' : 'Common curriculum'}
        </Badge>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="min-w-0">
          <h2 className="truncate font-display font-semibold text-ink-950">{cls.name}</h2>
          <p className="mt-1 text-sm text-ink-500">Level {cls.order}</p>
        </div>
        <ArrowUpRight
          className="h-5 w-5 shrink-0 text-ink-400 transition group-hover:text-primary-700"
          aria-hidden="true"
        />
      </div>
      {cls.description && <p className="mt-2 line-clamp-2 text-sm text-ink-500">{cls.description}</p>}
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-ink-100 pt-4">
        <span className="inline-flex items-center gap-2 text-sm text-ink-600">
          <Layers3 className="h-4 w-4" aria-hidden="true" />
          {cls.sectionsCount} sections
        </span>
        <span className="inline-flex items-center gap-2 text-sm text-ink-600">
          <BookOpen className="h-4 w-4" aria-hidden="true" />
          {cls.subjectsCount} subjects
        </span>
      </div>
    </Link>
  );
}
