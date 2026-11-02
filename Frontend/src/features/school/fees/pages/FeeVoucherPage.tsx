import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { PageLoader } from '@/components/ui/spinner';
import { usePermission } from '@/hooks/usePermission';
import { useTenantDateTime } from '@/hooks/useTenantDateTime';
import { useInvoice } from '../hooks/useFees';

function money(amount: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(amount);
}

export function FeeVoucherPage() {
  const { id } = useParams<{ id: string }>();
  const { can } = usePermission();
  const { formatDate, formatDateTime } = useTenantDateTime();
  const canView = can('fees.invoice.read');
  const invoiceQuery = useInvoice(canView ? id ?? null : null);

  if (!canView) {
    return (
      <AppLayout>
        <EmptyState title="No access" description="You need invoice permission to view vouchers." />
      </AppLayout>
    );
  }

  if (invoiceQuery.isPending) {
    return (
      <AppLayout>
        <div className="panel">
          <PageLoader compact />
        </div>
      </AppLayout>
    );
  }

  if (invoiceQuery.error || !invoiceQuery.data) {
    return (
      <AppLayout>
        <EmptyState
          title="Invoice not found"
          description={invoiceQuery.error?.message ?? 'This voucher is unavailable.'}
          action={
            <Link
              to="/fees"
              className="inline-flex items-center justify-center rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium"
            >
              Back to fees
            </Link>
          }
        />
      </AppLayout>
    );
  }

  const invoice = invoiceQuery.data;

  return (
    <AppLayout>
      <div className="space-y-6 print:space-y-0">
        <div className="print:hidden">
          <Link
            to="/fees"
            className="mb-4 inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-900"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to fees
          </Link>
          <PageHeader
            eyebrow="Fees"
            title="Fee voucher"
            description={invoice.title}
            actions={
              <Button type="button" variant="outline" onClick={() => window.print()}>
                <Printer className="h-4 w-4" aria-hidden="true" /> Print
              </Button>
            }
          />
        </div>

        <article className="panel mx-auto max-w-2xl overflow-hidden p-6 sm:p-8 print:max-w-none print:border-0 print:p-0 print:shadow-none">
          <header className="border-b border-ink-200 pb-5 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-700">
              Fee voucher
            </p>
            <h1 className="mt-2 font-display text-2xl font-semibold text-ink-950">{invoice.title}</h1>
            {invoice.periodLabel && (
              <p className="mt-1 text-sm text-ink-500">{invoice.periodLabel}</p>
            )}
          </header>

          <div className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <p className="text-ink-500">Student</p>
              <p className="font-semibold text-ink-950">{invoice.studentName}</p>
              <p className="text-ink-600">
                {invoice.admissionNo}
                {invoice.className ? ` · ${invoice.className}` : ''}
                {invoice.sectionName ? ` · ${invoice.sectionName}` : ''}
              </p>
            </div>
            <div className="sm:text-right">
              <p className="text-ink-500">Status</p>
              <Badge tone="primary">{invoice.status}</Badge>
              <p className="mt-2 text-ink-600">Due {formatDate(invoice.dueDate)}</p>
            </div>
          </div>

          <dl className="mt-6 grid gap-3 border-y border-ink-200 py-5 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-ink-500">Amount</dt>
              <dd className="font-semibold text-ink-950">{money(invoice.amount)}</dd>
            </div>
            <div>
              <dt className="text-ink-500">Paid</dt>
              <dd className="font-semibold text-ink-950">{money(invoice.amountPaid)}</dd>
            </div>
            <div>
              <dt className="text-ink-500">Balance</dt>
              <dd className="font-semibold text-ink-950">{money(invoice.balance)}</dd>
            </div>
          </dl>

          {(invoice.payments?.length ?? 0) > 0 && (
            <div className="mt-5">
              <h2 className="text-sm font-semibold text-ink-900">Payments</h2>
              <ul className="mt-2 divide-y divide-ink-100 text-sm">
                {invoice.payments?.map((payment) => (
                  <li key={payment.id} className="flex justify-between gap-3 py-2">
                    <span>
                      {money(payment.amount)} · {payment.method}
                      {payment.reference ? ` · ${payment.reference}` : ''}
                    </span>
                    <span className="text-ink-500">
                      {formatDateTime(payment.paidAt)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {invoice.notes && (
            <p className="mt-5 text-sm text-ink-600">
              <span className="font-medium text-ink-800">Notes: </span>
              {invoice.notes}
            </p>
          )}

          <footer className="mt-8 grid gap-8 text-sm sm:grid-cols-2">
            <div>
              <div className="h-12 border-b border-ink-300" />
              <p className="mt-2 text-ink-500">Cashier signature</p>
            </div>
            <div>
              <div className="h-12 border-b border-ink-300" />
              <p className="mt-2 text-ink-500">Parent / guardian signature</p>
            </div>
          </footer>
        </article>
      </div>
    </AppLayout>
  );
}
