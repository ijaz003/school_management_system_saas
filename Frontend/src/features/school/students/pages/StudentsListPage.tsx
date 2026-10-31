import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { PageLoader } from '@/components/ui/spinner';
import { usePermission } from '@/hooks/usePermission';
import { StudentFilters } from '../components/StudentFilters';
import { StudentTable } from '../components/StudentTable';
import { useDeleteStudent } from '../hooks/useDeleteStudent';
import type { StudentFilters as Filters } from '../hooks/keys';
import { useStudents, type StudentListItem } from '../hooks/useStudents';

export function StudentsListPage() {
  const navigate = useNavigate();
  const { can } = usePermission();
  const [filters, setFilters] = useState<Filters>({ page: 1, limit: 20 });
  const studentsQuery = useStudents(filters);
  const deleteStudent = useDeleteStudent();
  const items = studentsQuery.data?.items ?? [];
  const pagination = studentsQuery.data?.pagination;

  const handleDelete = (student: StudentListItem) => {
    if (window.confirm(`Delete student "${student.fullName}"? This soft-deletes the record.`)) {
      deleteStudent.mutate(student.id);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600">
              Academic
            </p>
            <h1 className="page-title mt-1 text-2xl">Students</h1>
            <p className="page-subtitle">Manage admissions, class placement, and guardians.</p>
          </div>
          {can('students.create') && (
            <Button onClick={() => navigate('/students/new')}>
              <Plus className="h-4 w-4" aria-hidden="true" /> Add student
            </Button>
          )}
        </header>

        {pagination && (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Total students" value={pagination.total} />
            <StatCard
              label="On this page"
              value={items.length}
            />
            <StatCard
              label="Active on page"
              value={items.filter((item) => item.status === 'active').length}
            />
            <StatCard
              label="Other status"
              value={items.filter((item) => item.status !== 'active').length}
            />
          </div>
        )}

        <StudentFilters value={filters} onChange={setFilters} />

        {studentsQuery.isPending ? (
          <div className="panel p-12">
            <PageLoader />
          </div>
        ) : studentsQuery.error ? (
          <section className="rounded-2xl border border-red-200 bg-white p-8 text-center">
            <h2 className="font-semibold text-ink-950">Failed to load students</h2>
            <p className="mt-2 text-sm text-ink-700">{studentsQuery.error.message}</p>
            <Button
              className="mt-4"
              variant="outline"
              onClick={() => void studentsQuery.refetch()}
              isLoading={studentsQuery.isFetching}
            >
              Try again
            </Button>
          </section>
        ) : items.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-ink-200 bg-white px-6 py-14 text-center">
            <h2 className="font-semibold text-ink-950">No students found</h2>
            <p className="mt-1 text-sm text-ink-700/70">
              {filters.search || filters.classId || filters.status
                ? 'Try adjusting your filters.'
                : 'Add your first student to start enrollment.'}
            </p>
            {can('students.create') && !filters.search && !filters.classId && (
              <Button className="mt-5" onClick={() => navigate('/students/new')}>
                <Plus className="h-4 w-4" aria-hidden="true" /> Add student
              </Button>
            )}
          </section>
        ) : (
          <>
            <StudentTable
              items={items}
              canUpdate={can('students.update')}
              canDelete={can('students.delete')}
              onView={(student) => navigate(`/students/${student.id}`)}
              onEdit={(student) => navigate(`/students/${student.id}/edit`)}
              onDelete={handleDelete}
            />
            {pagination && pagination.totalPages > 1 && (
              <footer className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-ink-700/70">
                  Page {pagination.page} of {pagination.totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page <= 1}
                    onClick={() =>
                      setFilters((current) => ({ ...current, page: (current.page ?? 1) - 1 }))
                    }
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() =>
                      setFilters((current) => ({ ...current, page: (current.page ?? 1) + 1 }))
                    }
                  >
                    Next
                  </Button>
                </div>
              </footer>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <section className="panel p-5">
      <p className="text-sm text-ink-700/70">{label}</p>
      <p className="mt-2 font-display text-2xl font-semibold text-ink-950">{value}</p>
    </section>
  );
}
