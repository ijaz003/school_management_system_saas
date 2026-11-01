import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { ListPagination } from '@/components/ui/list-pagination';
import { PageShell } from '@/components/ui/page-shell';
import { TableSkeleton } from '@/components/ui/skeleton';
import { SchoolFilters } from '../components/SchoolFilters';
import { SchoolsTable } from '../components/SchoolsTable';
import { useSchools } from '../hooks/useSchools';
import type { SchoolFilters as Filters } from '../hooks/keys';

export function SchoolsListPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<Filters>({ page: 1, limit: 20 });
  const { data, isPending, error, refetch, isFetching } = useSchools(filters);

  return (
    <AppLayout>
      <PageShell
          eyebrow="Platform"
          title="Schools management"
          description="Manage schools on your platform"
          actions={
            <Button onClick={() => navigate('/schools/new')}>
              <Plus className="h-4 w-4" aria-hidden="true" /> Add school
            </Button>
          }
      >

        <SchoolFilters value={filters} onChange={setFilters} />

        {isPending ? (
          <TableSkeleton rows={6} />
        ) : error ? (
          <section className="rounded-2xl border border-danger-100 bg-white p-8 text-center shadow-sm">
            <h2 className="font-display text-lg font-semibold text-ink-950">Could not load schools</h2>
            <p className="mt-2 text-sm text-ink-600">{error.message}</p>
            <Button
              className="mt-4"
              variant="outline"
              onClick={() => void refetch()}
              isLoading={isFetching}
            >
              Try again
            </Button>
          </section>
        ) : data ? (
          <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-ink-100">
            <SchoolsTable schools={data.items} />
          </section>
        ) : null}

        {data && (
          <ListPagination
            page={data.pagination.page}
            totalPages={data.pagination.totalPages}
            total={data.pagination.total}
            limit={data.pagination.limit}
            onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
          />
        )}
      </PageShell>
    </AppLayout>
  );
}
