import { useState } from 'react';
import { CheckCircle2, DollarSign, Receipt, Wallet } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { Badge, type BadgeTone } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { ListPagination } from '@/components/ui/list-pagination';
import { MetricCard, MetricGrid } from '@/components/ui/metric-card';
import { TableSkeleton } from '@/components/ui/skeleton';
import { ChildPageShell, QueryError } from '../components/ChildPageShell';
import { useChildFees } from '../hooks/useParentPortal';

const STATUS_TONE: Record<string, BadgeTone> = {
  paid: 'success',
  partial: 'warning',
  issued: 'primary',
  draft: 'neutral',
  cancelled: 'neutral',
};

function formatAmount(value: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(value);
}

export function ParentFeesPage() {
  const { studentId = '' } = useParams();
  const [pageState, setPageState] = useState({ studentId, page: 1 });
  // Pagination resets whenever the child changes.
  const page = pageState.studentId === studentId ? pageState.page : 1;
  const setPage = (next: number) => setPageState({ studentId, page: next });
  const feesQuery = useChildFees(studentId, page, 20);
  const items = feesQuery.data?.items ?? [];
  const pagination = feesQuery.data?.pagination;

  const billed = items.reduce((sum, invoice) => sum + invoice.amount, 0);
  const paid = items.reduce((sum, invoice) => sum + invoice.amountPaid, 0);
  const balance = items.reduce((sum, invoice) => sum + invoice.balance, 0);

  return (
    <ChildPageShell
      studentId={studentId}
      section="fees"
      title="Fees"
      description="Invoices, payments, and outstanding balances."
    >
      {feesQuery.isPending ? (
        <TableSkeleton rows={6} />
      ) : feesQuery.error ? (
        <QueryError
          title="Failed to load fees"
          message={feesQuery.error.message}
          onRetry={() => void feesQuery.refetch()}
          retrying={feesQuery.isFetching}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No invoices"
          description="No fee invoices have been issued for this child."
        />
      ) : (
        <>
          <MetricGrid>
            <MetricCard
              icon={<Receipt className="h-4 w-4" aria-hidden="true" />}
              label="Invoices"
              value={pagination?.total ?? items.length}
              tone="primary"
            />
            <MetricCard
              icon={<DollarSign className="h-4 w-4" aria-hidden="true" />}
              label="Billed (this page)"
              value={formatAmount(billed)}
            />
            <MetricCard
              icon={<CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
              label="Paid (this page)"
              value={formatAmount(paid)}
              tone="success"
            />
            <MetricCard
              icon={<Wallet className="h-4 w-4" aria-hidden="true" />}
              label="Balance (this page)"
              value={formatAmount(balance)}
              tone={balance > 0 ? 'danger' : 'success'}
            />
          </MetricGrid>

          <div className="panel overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-ink-100 bg-surface-muted/90 text-xs uppercase tracking-wide text-ink-500">
                  <tr>
                    <th className="px-5 py-3.5 font-semibold">Invoice</th>
                    <th className="px-5 py-3.5 font-semibold">Due date</th>
                    <th className="px-5 py-3.5 text-right font-semibold">Amount</th>
                    <th className="px-5 py-3.5 text-right font-semibold">Paid</th>
                    <th className="px-5 py-3.5 text-right font-semibold">Balance</th>
                    <th className="px-5 py-3.5 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody
                  className="divide-y divide-ink-100"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {items.map((invoice) => (
                    <tr key={invoice.id} className="transition hover:bg-primary-50/30">
                      <td className="px-5 py-3.5">
                        <span className="block font-semibold text-ink-950">{invoice.title}</span>
                        {invoice.periodLabel && (
                          <span className="block text-xs text-ink-500">{invoice.periodLabel}</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-ink-700">
                        {new Date(`${invoice.dueDate}T00:00:00`).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3.5 text-right text-ink-900">
                        {formatAmount(invoice.amount)}
                      </td>
                      <td className="px-5 py-3.5 text-right text-ink-700">
                        {formatAmount(invoice.amountPaid)}
                      </td>
                      <td
                        className={`px-5 py-3.5 text-right font-semibold ${
                          invoice.balance > 0 ? 'text-danger-700' : 'text-ink-700'
                        }`}
                      >
                        {formatAmount(invoice.balance)}
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge tone={STATUS_TONE[invoice.status] ?? 'neutral'}>
                          {invoice.status}
                        </Badge>
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
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </ChildPageShell>
  );
}
