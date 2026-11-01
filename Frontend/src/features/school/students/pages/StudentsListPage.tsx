import { useState } from 'react';
import { CreditCard, Download, GraduationCap, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { TableSkeleton } from '@/components/ui/skeleton';
import { usePermission } from '@/hooks/usePermission';
import { buildQueryString } from '@/lib/api';
import { downloadFile } from '@/lib/download';
import { StudentFilters } from '../components/StudentFilters';
import { StudentTable } from '../components/StudentTable';
import { useDeleteStudent } from '../hooks/useDeleteStudent';
import type { StudentFilters as Filters } from '../hooks/keys';
import { useStudents, type StudentListItem } from '../hooks/useStudents';

export function StudentsListPage() {
  const navigate = useNavigate();
  const { can } = usePermission();
  const [filters, setFilters] = useState<Filters>({ page: 1, limit: 20 });
  const [pendingDelete, setPendingDelete] = useState<StudentListItem | null>(null);
  const [exporting, setExporting] = useState(false);
  const studentsQuery = useStudents(filters);
  const deleteStudent = useDeleteStudent();
  const items = studentsQuery.data?.items ?? [];
  const pagination = studentsQuery.data?.pagination;
  const hasFilters = Boolean(filters.search || filters.classId || filters.status);

  const handleExport = async () => {
    setExporting(true);
    try {
      await downloadFile(
        `/school/exports/students${buildQueryString({
          search: filters.search,
          classId: filters.classId,
          sectionId: filters.sectionId,
          status: filters.status,
        })}`,
        'students.csv',
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Academic"
          title="Students"
          description="Manage admissions, class placement, and guardians."
          actions={
            <>
              {can('students.read') && (
                <Button variant="outline" onClick={() => void handleExport()} isLoading={exporting}>
                  <Download className="h-4 w-4" aria-hidden="true" /> Export CSV
                </Button>
              )}
              {can('students.read') && (
                <Button variant="outline" onClick={() => navigate('/students/id-cards')}>
                  <CreditCard className="h-4 w-4" aria-hidden="true" /> ID cards
                </Button>
              )}
              {can('students.create') && (
                <Button onClick={() => navigate('/students/new')}>
                  <Plus className="h-4 w-4" aria-hidden="true" /> Add student
                </Button>
              )}
            </>
          }
        />

        {pagination && (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Total students" value={pagination.total} />
            <StatCard label="On this page" value={items.length} />
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
          <TableSkeleton rows={8} />
        ) : studentsQuery.error ? (
          <section className="rounded-2xl border border-danger-100 bg-white p-8 text-center">
            <h2 className="font-semibold text-ink-950">Failed to load students</h2>
            <p className="mt-2 text-sm text-ink-600">{studentsQuery.error.message}</p>
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
          <EmptyState
            icon={GraduationCap}
            title="No students found"
            description={
              hasFilters
                ? 'Try adjusting or clearing your filters.'
                : 'Add your first student to start enrollment.'
            }
            action={
              can('students.create') && !hasFilters ? (
                <Button onClick={() => navigate('/students/new')}>
                  <Plus className="h-4 w-4" aria-hidden="true" /> Add student
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <StudentTable
              items={items}
              canUpdate={can('students.update')}
              canDelete={can('students.delete')}
              onView={(student) => navigate(`/students/${student.id}`)}
              onEdit={(student) => navigate(`/students/${student.id}/edit`)}
              onDelete={setPendingDelete}
            />
            {pagination && (
              <footer className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-ink-500">
                  Showing page {pagination.page} of {pagination.totalPages} · {pagination.total}{' '}
                  total
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

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete student?"
        description={
          pendingDelete
            ? `“${pendingDelete.fullName}” will be soft-deleted and hidden from active lists.`
            : ''
        }
        confirmLabel="Delete student"
        loading={deleteStudent.isPending}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete) return;
          deleteStudent.mutate(pendingDelete.id, {
            onSuccess: () => setPendingDelete(null),
          });
        }}
      />
    </AppLayout>
  );
}
