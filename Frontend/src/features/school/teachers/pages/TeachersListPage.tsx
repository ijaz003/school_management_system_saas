import { useState } from 'react';
import { BookOpen, GraduationCap, Search, UserCheck, UserRound, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { TableSkeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/ui/stat-card';
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
      <div className="space-y-6">
        <PageHeader
          eyebrow="Academic"
          title="Teachers"
          description="Assign subject teachers and class teachers to sections. Create teacher accounts from Staff."
          actions={
            <Button variant="outline" onClick={() => navigate('/settings/staff/new')}>
              Add via Staff
            </Button>
          }
        />

        {pagination && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total teachers" value={pagination.total} icon={Users} />
            <StatCard label="On this page" value={items.length} icon={UserCheck} />
            <StatCard
              label="With subjects"
              value={items.filter((item) => item.assignmentCount > 0).length}
              icon={BookOpen}
            />
            <StatCard
              label="Class teachers"
              value={items.filter((item) => item.classTeacherCount > 0).length}
              icon={GraduationCap}
            />
          </div>
        )}

        <section className="panel p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
            <div className="relative md:col-span-8">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
                aria-hidden="true"
              />
              <Input
                type="search"
                aria-label="Search teachers"
                placeholder="Search by name, email, or phone"
                className="pl-10"
                value={filters.search ?? ''}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    search: event.target.value || undefined,
                    page: 1,
                  }))
                }
              />
            </div>
            <select
              aria-label="Filter by status"
              className="field-select md:col-span-4"
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
          </div>
        </section>

        {teachersQuery.isPending ? (
          <TableSkeleton rows={6} />
        ) : teachersQuery.error ? (
          <section className="panel border-danger-100 p-8 text-center">
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
            <div className="panel overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="sticky top-0 border-b border-ink-100 bg-ink-50 text-xs uppercase tracking-wide text-ink-500">
                    <tr>
                      <th className="px-4 py-3 font-semibold sm:px-5">Teacher</th>
                      <th className="px-4 py-3 font-semibold sm:px-5">Contact</th>
                      <th className="px-4 py-3 font-semibold sm:px-5">Subject assignments</th>
                      <th className="px-4 py-3 font-semibold sm:px-5">Class teacher</th>
                      <th className="px-4 py-3 font-semibold sm:px-5">Status</th>
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {pagination && pagination.totalPages > 1 && (
              <footer className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-ink-500">
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
