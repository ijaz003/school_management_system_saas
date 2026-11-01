import { useState } from 'react';
import { BookOpen, Plus, Search } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { FilterField, FiltersPanel } from '@/components/ui/filters-panel';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { PageShell } from '@/components/ui/page-shell';
import { PageLoader } from '@/components/ui/spinner';
import { usePermission } from '@/hooks/usePermission';
import { hasActiveFilters } from '@/lib/list-filters';
import { ClassCard } from '../components/ClassCard';
import { ClassForm } from '../components/ClassForm';
import { useClasses } from '../hooks/useClasses';

export function ClassesListPage() {
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const { can } = usePermission();
  const query = useClasses(search);
  const classes = query.data ?? [];
  const canCreate = can('classes.create');
  const filtersActive = hasActiveFilters({ search });

  const addButton = (
    <Button onClick={() => setCreating(true)}>
      <Plus className="h-4 w-4" aria-hidden="true" />
      Add class
    </Button>
  );

  return (
    <AppLayout>
      <PageShell
        eyebrow="Academic"
        title="Classes"
        description="Organize grade levels, subjects, and sections."
        actions={canCreate ? addButton : undefined}
      >
        <FiltersPanel
          description="Find classes by name."
          onClear={() => setSearch('')}
          clearDisabled={!filtersActive}
        >
          <FilterField
            id="class-search"
            label="Search"
            icon={<Search className="h-3.5 w-3.5 text-ink-400" aria-hidden />}
            className="md:col-span-6"
          >
            <Input
              id="class-search"
              type="search"
              aria-label="Search classes"
              placeholder="Search classes..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </FilterField>
        </FiltersPanel>

        {query.isPending ? (
          <div className="panel">
            <PageLoader compact />
          </div>
        ) : query.error ? (
          <section className="panel border-danger-100 p-8 text-center">
            <h2 className="font-display font-semibold text-ink-950">Failed to load classes</h2>
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
        ) : classes.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title={search ? 'No matching classes' : 'No classes yet'}
            description={
              search
                ? 'Try a different search.'
                : 'Create your first class to start organizing the academic year.'
            }
            action={!search && canCreate ? addButton : undefined}
          />
        ) : (
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {classes.map((cls) => (
              <ClassCard key={cls.id} cls={cls} />
            ))}
          </section>
        )}

        {creating && (
          <Modal
            onClose={() => setCreating(false)}
            title="Create class"
            description="Set up a new grade level for your school."
            size="lg"
          >
            <ClassForm onSuccess={() => setCreating(false)} onCancel={() => setCreating(false)} />
          </Modal>
        )}
      </PageShell>
    </AppLayout>
  );
}
