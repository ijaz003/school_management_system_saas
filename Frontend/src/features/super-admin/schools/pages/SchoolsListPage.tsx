import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageLoader } from '@/components/ui/spinner';
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
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Schools management</h1>
            <p className="mt-1 text-sm text-gray-500">Manage schools on your platform</p>
          </div>
          <Button onClick={() => navigate('/schools/new')}>
            <Plus className="h-4 w-4" aria-hidden="true" /> Add school
          </Button>
        </header>

        <SchoolFilters value={filters} onChange={setFilters} />

        {isPending ? (
          <div className="rounded-xl border border-gray-200 bg-white p-12"><PageLoader /></div>
        ) : error ? (
          <Card className="p-8 text-center">
            <h2 className="text-lg font-semibold text-gray-900">Could not load schools</h2>
            <p className="mt-2 text-sm text-gray-600">{error.message}</p>
            <Button className="mt-4" variant="outline" onClick={() => void refetch()} isLoading={isFetching}>Try again</Button>
          </Card>
        ) : data ? (
          <Card>
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
          </Card>
        ) : null}
      </div>
    </AppLayout> 
  );
}
