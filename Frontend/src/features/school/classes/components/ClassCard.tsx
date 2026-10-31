import { ArrowUpRight, BookOpen, Layers3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ClassItem } from '../hooks/useClasses';

export function ClassCard({ cls }: { cls: ClassItem }) {
  return (
    <Link
      to={`/settings/classes/${cls.id}`}
      className="group block rounded-xl border border-gray-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <div className="flex items-start justify-between">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><BookOpen className="h-6 w-6" aria-hidden="true" /></span>
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${cls.type === 'streamed' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
          {cls.type === 'streamed' ? 'Streamed' : 'Common curriculum'}
        </span>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div><h2 className="font-semibold text-gray-900">{cls.name}</h2><p className="mt-1 text-sm text-gray-500">Level {cls.order}</p></div>
        <ArrowUpRight className="h-5 w-5 text-gray-400 transition group-hover:text-blue-600" aria-hidden="true" />
      </div>
      {cls.description && <p className="mt-2 line-clamp-2 text-sm text-gray-500">{cls.description}</p>}
      <div className="mt-4 flex gap-6 border-t border-gray-100 pt-4">
        <span className="inline-flex items-center gap-2 text-sm text-gray-600"><Layers3 className="h-4 w-4" aria-hidden="true" />{cls.sectionsCount} sections</span>
        <span className="inline-flex items-center gap-2 text-sm text-gray-600"><BookOpen className="h-4 w-4" aria-hidden="true" />{cls.subjectsCount} subjects</span>
      </div>
    </Link>
  );
}
