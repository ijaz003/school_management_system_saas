import { useState } from 'react';
import { BookOpen, Plus, Search } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageLoader } from '@/components/ui/spinner';
import { usePermission } from '@/hooks/usePermission';
import { ClassCard } from '../components/ClassCard';
import { ClassForm } from '../components/ClassForm';
import { useClasses } from '../hooks/useClasses';

export function ClassesListPage() {
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const { can } = usePermission();
  const query = useClasses(search);
  const classes = query.data ?? [];

  return (
    <AppLayout>
      <div className="space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div><h1 className="text-2xl font-bold text-gray-900">Classes</h1><p className="mt-1 text-sm text-gray-500">Organize grade levels, subjects, and sections.</p></div>
          {can('classes.create') && <Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" aria-hidden="true" />Add class</Button>}
        </header>
        <section className="rounded-xl border border-gray-200 bg-white p-4">
          <label htmlFor="class-search" className="sr-only">Search classes</label>
          <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" /><Input id="class-search" type="search" className="pl-10" placeholder="Search classes..." value={search} onChange={(event) => setSearch(event.target.value)} /></div>
        </section>
        {query.isPending ? (
          <div className="rounded-xl border border-gray-200 bg-white p-12"><PageLoader /></div>
        ) : query.error ? (
          <section className="rounded-xl border border-red-200 bg-white p-8 text-center"><h2 className="font-semibold text-gray-900">Failed to load classes</h2><p className="mt-2 text-sm text-gray-600">{query.error.message}</p><Button className="mt-4" variant="outline" onClick={() => void query.refetch()} isLoading={query.isFetching}>Try again</Button></section>
        ) : classes.length === 0 ? (
          <section className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
            <BookOpen className="mx-auto h-10 w-10 text-gray-300" aria-hidden="true" /><h2 className="mt-3 font-semibold text-gray-900">{search ? 'No matching classes' : 'No classes yet'}</h2>
            <p className="mt-1 text-sm text-gray-500">{search ? 'Try a different search.' : 'Create your first class to start organizing the academic year.'}</p>
            {!search && can('classes.create') && <Button className="mt-4" onClick={() => setCreating(true)}><Plus className="h-4 w-4" aria-hidden="true" />Add class</Button>}
          </section>
        ) : <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{classes.map((cls) => <ClassCard key={cls.id} cls={cls} />)}</section>}
        {creating && <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setCreating(false); }}><section role="dialog" aria-modal="true" aria-labelledby="create-class-title" className="my-8 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl"><header className="mb-5 flex items-center justify-between"><div><h2 id="create-class-title" className="text-xl font-bold text-gray-900">Create class</h2><p className="mt-1 text-sm text-gray-500">Set up a new grade level for your school.</p></div><Button type="button" variant="ghost" onClick={() => setCreating(false)} aria-label="Close">×</Button></header><ClassForm onSuccess={() => setCreating(false)} onCancel={() => setCreating(false)} /></section></div>}
      </div>
    </AppLayout>
  );
}
