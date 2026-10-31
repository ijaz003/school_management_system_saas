import { useState } from 'react';
import { Search, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageLoader } from '@/components/ui/spinner';
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
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600">
              Academic
            </p>
            <h1 className="page-title mt-1 text-2xl">Teachers</h1>
            <p className="page-subtitle">
              Assign subject teachers and class teachers to sections. Create teacher accounts from Staff.
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/settings/staff/new')}>
            Add via Staff
          </Button>
        </header>

        {pagination && (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Total teachers" value={pagination.total} />
            <StatCard label="On this page" value={items.length} />
            <StatCard
              label="With subjects"
              value={items.filter((item) => item.assignmentCount > 0).length}
            />
            <StatCard
              label="Class teachers"
              value={items.filter((item) => item.classTeacherCount > 0).length}
            />
          </div>
        )}

        <section className="panel p-4">
          <div className="grid gap-3 md:grid-cols-12">
            <div className="relative md:col-span-8">
              <Search
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-700/45"
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
              className="rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 md:col-span-4"
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
          <div className="panel p-12">
            <PageLoader />
          </div>
        ) : teachersQuery.error ? (
          <section className="rounded-2xl border border-red-200 bg-white p-8 text-center">
            <h2 className="font-semibold text-ink-950">Failed to load teachers</h2>
            <p className="mt-2 text-sm text-ink-700">{teachersQuery.error.message}</p>
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
          <section className="rounded-2xl border border-dashed border-ink-200 bg-white px-6 py-14 text-center">
            <UserRound className="mx-auto h-10 w-10 text-ink-200" aria-hidden="true" />
            <h2 className="mt-3 font-semibold text-ink-950">No teachers found</h2>
            <p className="mt-1 text-sm text-ink-700/70">
              Create a staff account with the Teacher role, then assign subjects here.
            </p>
            <Button className="mt-5" onClick={() => navigate('/settings/staff/new')}>
              Go to Staff
            </Button>
          </section>
        ) : (
          <>
            <div className="panel overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-ink-100 bg-surface/80 text-xs uppercase tracking-wide text-ink-700/70">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Teacher</th>
                      <th className="px-5 py-3 font-semibold">Contact</th>
                      <th className="px-5 py-3 font-semibold">Subject assignments</th>
                      <th className="px-5 py-3 font-semibold">Class teacher</th>
                      <th className="px-5 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    {items.map((teacher) => (
                      <tr
                        key={teacher.id}
                        className="cursor-pointer hover:bg-surface/60"
                        onClick={() => navigate(`/teachers/${teacher.id}`)}
                      >
                        <td className="px-5 py-4">
                          <span className="block font-semibold text-ink-950">{teacher.fullName}</span>
                          {teacher.subject && (
                            <span className="block text-xs text-ink-700/65">{teacher.subject}</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span className="block text-ink-800">{teacher.email}</span>
                          <span className="block text-xs text-ink-700/65">{teacher.phone || '—'}</span>
                        </td>
                        <td className="px-5 py-4 text-ink-800">{teacher.assignmentCount}</td>
                        <td className="px-5 py-4 text-ink-800">{teacher.classTeacherCount}</td>
                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                              teacher.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-ink-100 text-ink-800'
                            }`}
                          >
                            {teacher.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

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
