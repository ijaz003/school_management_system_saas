import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { TableSkeleton } from '@/components/ui/skeleton';
import { Pagination } from '../components/Pagination';
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
      <div className="space-y-6">
        <PageHeader
          eyebrow="Platform"
          title="Schools management"
          description="Manage schools on your platform"
          actions={
            <Button onClick={() => navigate('/schools/new')}>
              <Plus className="h-4 w-4" aria-hidden="true" /> Add school
            </Button>
          }
        />

        <SchoolFilters value={filters} onChange={setFilters} />

        {isPending ? (
          <TableSkeleton rows={6} />
        ) : error ? (
          <section className="panel border-danger-100 p-8 text-center">
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
          <section className="panel overflow-hidden p-0">
            <SchoolsTable schools={data.items} />
            {data.pagination.totalPages > 1 && (
              <Pagination
                page={data.pagination.page}
                totalPages={data.pagination.totalPages}
                total={data.pagination.total}
                limit={data.pagination.limit}
                onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
              />
            )}
          </section>
        ) : null}
      </div>
    </AppLayout>
  );
}
