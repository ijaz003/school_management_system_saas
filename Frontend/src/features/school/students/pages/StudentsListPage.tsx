import { useState } from 'react';
import { CheckCircle2, CreditCard, Download, GraduationCap, Plus, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { ListPagination } from '@/components/ui/list-pagination';
import { MetricCard, MetricGrid } from '@/components/ui/metric-card';
import { PageShell } from '@/components/ui/page-shell';
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
      <PageShell
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
      >
        {pagination && (
          <MetricGrid>
            <MetricCard icon={<GraduationCap className="h-4 w-4" aria-hidden="true" />} label="Total students" value={pagination.total} tone="primary" />
            <MetricCard icon={<Users className="h-4 w-4" aria-hidden="true" />} label="On this page" value={items.length} />
            <MetricCard
              icon={<CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
              label="Active on page"
              value={items.filter((item) => item.status === 'active').length}
              tone="success"
            />
            <MetricCard
              label="Other status"
              value={items.filter((item) => item.status !== 'active').length}
              tone="warning"
            />
          </MetricGrid>
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
              <ListPagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                total={pagination.total}
                limit={pagination.limit}
                onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
              />
            )}
          </>
        )}
      </PageShell>

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
