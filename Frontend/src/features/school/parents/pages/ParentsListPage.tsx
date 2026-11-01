import { useState } from 'react';
import { Link2, Plus, UserCheck, UserX, Users } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ListPagination } from '@/components/ui/list-pagination';
import { MetricCard, MetricGrid } from '@/components/ui/metric-card';
import { PageShell } from '@/components/ui/page-shell';
import { TableSkeleton } from '@/components/ui/skeleton';
import { hasActiveFilters } from '@/lib/list-filters';
import { CreateParentModal } from '../components/CreateParentModal';
import { ParentDetailModal } from '../components/ParentDetailModal';
import { ParentFilters } from '../components/ParentFilters';
import { ParentTable } from '../components/ParentTable';
import { TempPasswordModal } from '../components/TempPasswordModal';
import type { ParentFilters as Filters } from '../hooks/keys';
import { useParents, type ParentRecord } from '../hooks/useParents';

interface PasswordNotice {
  email: string;
  tempPassword: string;
  title: string;
}

export function ParentsListPage() {
  const [filters, setFilters] = useState<Filters>({ page: 1, limit: 20 });
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<ParentRecord | null>(null);
  const [passwordNotice, setPasswordNotice] = useState<PasswordNotice | null>(null);
  const parentsQuery = useParents(filters);

  const items = parentsQuery.data?.items ?? [];
  const pagination = parentsQuery.data?.pagination;
  const filtered = hasActiveFilters(filters);

  return (
    <AppLayout>
      <PageShell
        eyebrow="Administration"
        title="Parents"
        description="Manage parent portal accounts and link them to their children."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" /> Add parent
          </Button>
        }
      >
        {pagination && (
          <MetricGrid>
            <MetricCard
              icon={<Users className="h-4 w-4" aria-hidden="true" />}
              label="Total parents"
              value={pagination.total}
              tone="primary"
            />
            <MetricCard
              icon={<UserCheck className="h-4 w-4" aria-hidden="true" />}
              label="Active on page"
              value={items.filter((item) => item.isActive).length}
              tone="success"
            />
            <MetricCard
              icon={<Link2 className="h-4 w-4" aria-hidden="true" />}
              label="Linked on page"
              value={items.filter((item) => item.childrenCount > 0).length}
            />
            <MetricCard
              icon={<UserX className="h-4 w-4" aria-hidden="true" />}
              label="Inactive on page"
              value={items.filter((item) => !item.isActive).length}
              tone="warning"
            />
          </MetricGrid>
        )}

        <ParentFilters value={filters} onChange={setFilters} />

        {parentsQuery.isPending ? (
          <TableSkeleton rows={6} />
        ) : parentsQuery.error ? (
          <section className="rounded-2xl border border-danger-100 bg-white p-8 text-center shadow-sm">
            <h2 className="font-display font-semibold text-ink-950">Failed to load parents</h2>
            <p className="mt-2 text-sm text-ink-600">{parentsQuery.error.message}</p>
            <Button
              className="mt-4"
              variant="outline"
              onClick={() => void parentsQuery.refetch()}
              isLoading={parentsQuery.isFetching}
            >
              Try again
            </Button>
          </section>
        ) : items.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No parents found"
            description={
              filtered
                ? 'Try adjusting or clearing your filters.'
                : 'Add a parent account so guardians can follow attendance, fees, and results.'
            }
            action={
              !filtered ? (
                <Button onClick={() => setCreating(true)}>
                  <Plus className="h-4 w-4" aria-hidden="true" /> Add parent
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <ParentTable items={items} onManage={setSelected} />
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

      {creating && (
        <CreateParentModal
          onClose={() => setCreating(false)}
          onCreated={({ parent, tempPassword }) => {
            setCreating(false);
            setPasswordNotice({
              email: parent.email,
              tempPassword,
              title: 'Parent account created',
            });
          }}
        />
      )}

      {selected && (
        <ParentDetailModal
          parentId={selected.id}
          initial={selected}
          onClose={() => setSelected(null)}
          onPasswordReset={(result) =>
            setPasswordNotice({
              email: result.email,
              tempPassword: result.tempPassword,
              title: 'Password reset',
            })
          }
        />
      )}

      {passwordNotice && (
        <TempPasswordModal
          title={passwordNotice.title}
          email={passwordNotice.email}
          tempPassword={passwordNotice.tempPassword}
          onClose={() => setPasswordNotice(null)}
        />
      )}
    </AppLayout>
  );
}
