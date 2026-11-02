import { useState } from 'react';
import { BookOpen, GraduationCap, Search, UserCheck, UserRound, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { FilterField, FiltersPanel } from '@/components/ui/filters-panel';
import { ListPagination } from '@/components/ui/list-pagination';
import { MetricCard, MetricGrid } from '@/components/ui/metric-card';
import { PageShell } from '@/components/ui/page-shell';
import { RowActions } from '@/components/ui/row-actions';
import { TableSkeleton } from '@/components/ui/skeleton';
import { hasActiveFilters, resetListFilters } from '@/lib/list-filters';
import type { TeacherFilters } from '../hooks/keys';
import { useTeachers } from '../hooks/useTeachers';

export function TeachersListPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<TeacherFilters>({ page: 1, limit: 20 });
  const teachersQuery = useTeachers(filters);
  const items = teachersQuery.data?.items ?? [];
  const pagination = teachersQuery.data?.pagination;

  return (
    <AppLayout>
      <PageShell
          eyebrow="Academic"
          title="Teachers"
          description="Assign subject teachers and class teachers to sections. Create teacher accounts from Staff."
          actions={
            <Button variant="outline" onClick={() => navigate('/settings/staff/new')}>
              Add via Staff
            </Button>
          }
      >
        {pagination && (
          <MetricGrid>
            <MetricCard icon={<Users className="h-4 w-4" aria-hidden="true" />} label="Total teachers" value={pagination.total} tone="primary" />
            <MetricCard icon={<UserCheck className="h-4 w-4" aria-hidden="true" />} label="On this page" value={items.length} />
            <MetricCard
              icon={<BookOpen className="h-4 w-4" aria-hidden="true" />}
              label="With subjects"
              value={items.filter((item) => item.assignmentCount > 0).length}
              tone="success"
            />
            <MetricCard
              icon={<GraduationCap className="h-4 w-4" aria-hidden="true" />}
              label="Class teachers"
              value={items.filter((item) => item.classTeacherCount > 0).length}
              tone="warning"
            />
          </MetricGrid>
        )}

        <FiltersPanel
          description="Search teachers by name, contact, or status."
          pageLimit={filters.limit ?? 20}
          onPageLimitChange={(limit) => setFilters((current) => ({ ...current, limit, page: 1 }))}
          onClear={() => setFilters((current) => resetListFilters(current))}
          clearDisabled={!hasActiveFilters(filters)}
        >
          <FilterField
            id="teacher-search"
            label="Search"
            icon={<Search className="h-3.5 w-3.5 text-ink-400" aria-hidden="true" />}
            className="md:col-span-8"
          >
            <Input
              id="teacher-search"
              type="search"
              aria-label="Search teachers"
              placeholder="Search by name, email, or phone"
              value={filters.search ?? ''}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  search: event.target.value || undefined,
                  page: 1,
                }))
              }
            />
          </FilterField>
          <FilterField id="teacher-status" label="Status" className="md:col-span-4">
            <select
              id="teacher-status"
              aria-label="Filter by status"
              className="field-select"
              value={filters.isActive === undefined ? '' : String(filters.isActive)}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  isActive:
                    event.target.value === '' ? undefined : event.target.value === 'true',
                  page: 1,
                }))
              }
            >
              <option value="">All statuses</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </FilterField>
        </FiltersPanel>

        {teachersQuery.isPending ? (
          <TableSkeleton rows={6} />
        ) : teachersQuery.error ? (
          <section className="rounded-2xl border border-danger-100 bg-white p-8 text-center shadow-sm">
            <h2 className="font-display font-semibold text-ink-950">Failed to load teachers</h2>
            <p className="mt-2 text-sm text-ink-600">{teachersQuery.error.message}</p>
            <Button
              className="mt-4"
              variant="outline"
              onClick={() => void teachersQuery.refetch()}
              isLoading={teachersQuery.isFetching}
            >
              Try again
            </Button>
          </section>
        ) : items.length === 0 ? (
          <EmptyState
            icon={UserRound}
            title="No teachers found"
            description="Create a staff account with the Teacher role, then assign subjects here."
            action={<Button onClick={() => navigate('/settings/staff/new')}>Go to Staff</Button>}
          />
        ) : (
          <>
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-ink-100">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="sticky top-0 border-b border-ink-100 bg-ink-50 text-xs uppercase tracking-wide text-ink-500">
                    <tr>
                      <th className="px-4 py-3 font-semibold sm:px-5">Teacher</th>
                      <th className="px-4 py-3 font-semibold sm:px-5">Contact</th>
                      <th className="px-4 py-3 font-semibold sm:px-5">Subject assignments</th>
                      <th className="px-4 py-3 font-semibold sm:px-5">Class teacher</th>
                      <th className="px-4 py-3 font-semibold sm:px-5">Status</th>
                      <th className="px-4 py-3 text-right font-semibold sm:px-5">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    {items.map((teacher) => (
                      <tr
                        key={teacher.id}
                        className="cursor-pointer transition hover:bg-ink-50"
                        onClick={() => navigate(`/teachers/${teacher.id}`)}
                      >
                        <td className="px-4 py-4 sm:px-5">
                          <span className="block whitespace-nowrap font-semibold text-ink-950">
                            {teacher.fullName}
                          </span>
                          {teacher.subject && (
                            <span className="block text-xs text-ink-500">{teacher.subject}</span>
                          )}
                        </td>
                        <td className="px-4 py-4 sm:px-5">
                          <span className="block text-ink-800">{teacher.email}</span>
                          <span className="block text-xs text-ink-500">{teacher.phone || '—'}</span>
                        </td>
                        <td className="px-4 py-4 text-ink-800 sm:px-5">{teacher.assignmentCount}</td>
                        <td className="px-4 py-4 text-ink-800 sm:px-5">{teacher.classTeacherCount}</td>
                        <td className="px-4 py-4 sm:px-5">
                          <Badge tone={teacher.isActive ? 'success' : 'neutral'}>
                            {teacher.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td
                          className="px-4 py-4 sm:px-5"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <RowActions
                            onPreview={() => navigate(`/teachers/${teacher.id}`)}
                            previewLabel={`View ${teacher.fullName}`}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

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
    </AppLayout>
  );
}
