import { useMemo, useState, type ReactNode } from 'react';
import { Banknote, Plus, Receipt, Trash2, Wallet } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { PageLoader } from '@/components/ui/spinner';
import { usePermission } from '@/hooks/usePermission';
import { useClasses } from '@/features/school/classes/hooks/useClasses';
import { useStudents } from '@/features/school/students/hooks/useStudents';
import {
  useCreateFeeStructure,
  useCreateInvoice,
  useDeleteFeeStructure,
  useFeeStructures,
  useGenerateInvoices,
  useInvoice,
  useInvoices,
  useRecordPayment,
  useVoidPayment,
  type FeeInvoice,
} from '../hooks/useFees';
import type {
  FeeFrequency,
  InvoiceFilters,
  InvoiceStatus,
  PaymentMethod,
} from '../hooks/keys';

const selectClass =
  'w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500';

function formatMoney(amount: number) {
  return new Intl.NumberFormat(undefined, {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(amount);
}

const statusStyles: Record<InvoiceStatus, string> = {
  draft: 'bg-ink-100 text-ink-700',
  issued: 'bg-amber-100 text-amber-800',
  partial: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

type Tab = 'invoices' | 'structures';

export function FeesPage() {
  const { can } = usePermission();
  const canCreateInvoice = can('fees.invoice.create');
  const canRecordPayment = can('fees.payment.record');
  const canEditStructure = can('fees.structure.edit');
  const canRefund = can('fees.payment.refund');

  const [tab, setTab] = useState<Tab>('invoices');
  const [filters, setFilters] = useState<InvoiceFilters>({ page: 1, limit: 20 });
  const [creatingInvoice, setCreatingInvoice] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [creatingStructure, setCreatingStructure] = useState(false);
  const [paymentInvoiceId, setPaymentInvoiceId] = useState<string | null>(null);
  const [detailInvoiceId, setDetailInvoiceId] = useState<string | null>(null);

  const invoicesQuery = useInvoices(filters);
  const structuresQuery = useFeeStructures();
  const deleteStructure = useDeleteFeeStructure();
  const classesQuery = useClasses();

  const items = invoicesQuery.data?.items ?? [];
  const pagination = invoicesQuery.data?.pagination;
  const structures = structuresQuery.data ?? [];

  return (
    <AppLayout>
      <div className="space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600">
              Finance
            </p>
            <h1 className="page-title mt-1 text-2xl">Fees</h1>
            <p className="page-subtitle">Structures, invoices, and payments.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {tab === 'invoices' && canCreateInvoice && (
              <>
                <Button variant="outline" onClick={() => setGenerating(true)}>
                  Generate for class
                </Button>
                <Button onClick={() => setCreatingInvoice(true)}>
                  <Plus className="h-4 w-4" aria-hidden="true" /> New invoice
                </Button>
              </>
            )}
            {tab === 'structures' && canEditStructure && (
              <Button onClick={() => setCreatingStructure(true)}>
                <Plus className="h-4 w-4" aria-hidden="true" /> New structure
              </Button>
            )}
          </div>
        </header>

        <div className="flex gap-2 border-b border-ink-200">
          <TabButton active={tab === 'invoices'} onClick={() => setTab('invoices')}>
            Invoices
          </TabButton>
          <TabButton active={tab === 'structures'} onClick={() => setTab('structures')}>
            Structures
          </TabButton>
        </div>

        {tab === 'invoices' ? (
          <>
            <section className="panel grid gap-3 p-4 md:grid-cols-12">
              <div className="md:col-span-5">
                <Input
                  type="search"
                  aria-label="Search invoices"
                  placeholder="Search student, title, period..."
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
                className={`${selectClass} md:col-span-3`}
                value={filters.status ?? ''}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    status: (event.target.value || undefined) as InvoiceStatus | undefined,
                    page: 1,
                  }))
                }
              >
                <option value="">All statuses</option>
                <option value="draft">Draft</option>
                <option value="issued">Issued</option>
                <option value="partial">Partial</option>
                <option value="paid">Paid</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <select
                aria-label="Filter by class"
                className={`${selectClass} md:col-span-4`}
                value={filters.classId ?? ''}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    classId: event.target.value || undefined,
                    page: 1,
                  }))
                }
              >
                <option value="">All classes</option>
                {(classesQuery.data ?? []).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </section>

            {invoicesQuery.isPending ? (
              <div className="panel p-12">
                <PageLoader />
              </div>
            ) : invoicesQuery.error ? (
              <section className="rounded-2xl border border-red-200 bg-white p-8 text-center">
                <h2 className="font-semibold text-ink-950">Failed to load invoices</h2>
                <p className="mt-2 text-sm text-ink-700">{invoicesQuery.error.message}</p>
              </section>
            ) : items.length === 0 ? (
              <EmptyState
                icon={<Receipt className="mx-auto h-10 w-10 text-ink-200" />}
                title="No invoices yet"
                subtitle="Create an invoice or generate from a fee structure."
              />
            ) : (
              <div className="space-y-3">
                {items.map((invoice) => (
                  <InvoiceRow
                    key={invoice.id}
                    invoice={invoice}
                    canRecordPayment={canRecordPayment}
                    onPay={() => setPaymentInvoiceId(invoice.id)}
                    onOpen={() => setDetailInvoiceId(invoice.id)}
                  />
                ))}
              </div>
            )}

            {pagination && pagination.totalPages > 1 && (
              <footer className="flex justify-between gap-3">
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
        ) : structuresQuery.isPending ? (
          <div className="panel p-12">
            <PageLoader />
          </div>
        ) : structures.length === 0 ? (
          <EmptyState
            icon={<Banknote className="mx-auto h-10 w-10 text-ink-200" />}
            title="No fee structures"
            subtitle="Define tuition or other recurring fees by class."
          />
        ) : (
          <div className="space-y-3">
            {structures.map((structure) => (
              <article key={structure.id} className="panel flex flex-wrap items-start justify-between gap-3 p-5">
                <div>
                  <div className="mb-2 flex flex-wrap gap-2">
                    <span className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium capitalize text-primary-700">
                      {structure.frequency.replace('_', ' ')}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        structure.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-ink-100 text-ink-600'
                      }`}
                    >
                      {structure.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <h2 className="font-display text-lg font-semibold text-ink-950">
                    {structure.name}
                  </h2>
                  <p className="mt-1 text-sm text-ink-700">
                    {structure.className ?? 'All classes'} · {formatMoney(structure.amount)}
                  </p>
                  {structure.description && (
                    <p className="mt-2 text-sm text-ink-700/70">{structure.description}</p>
                  )}
                </div>
                {canEditStructure && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    aria-label="Delete structure"
                    onClick={() => {
                      if (window.confirm(`Delete "${structure.name}"?`)) {
                        deleteStructure.mutate(structure.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                )}
              </article>
            ))}
          </div>
        )}
      </div>

      {creatingInvoice && <CreateInvoiceModal onClose={() => setCreatingInvoice(false)} />}
      {generating && <GenerateInvoicesModal onClose={() => setGenerating(false)} />}
      {creatingStructure && (
        <CreateStructureModal onClose={() => setCreatingStructure(false)} />
      )}
      {paymentInvoiceId && (
        <PaymentModal invoiceId={paymentInvoiceId} onClose={() => setPaymentInvoiceId(null)} />
      )}
      {detailInvoiceId && (
        <InvoiceDetailModal
          invoiceId={detailInvoiceId}
          canRefund={canRefund}
          onClose={() => setDetailInvoiceId(null)}
        />
      )}
    </AppLayout>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border-b-2 px-4 py-2.5 text-sm font-medium transition ${
        active
          ? 'border-primary-600 text-primary-700'
          : 'border-transparent text-ink-700/70 hover:text-ink-950'
      }`}
    >
      {children}
    </button>
  );
}

function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <section className="rounded-2xl border border-dashed border-ink-200 bg-white px-6 py-14 text-center">
      {icon}
      <h2 className="mt-3 font-semibold text-ink-950">{title}</h2>
      <p className="mt-1 text-sm text-ink-700/70">{subtitle}</p>
    </section>
  );
}

function InvoiceRow({
  invoice,
  canRecordPayment,
  onPay,
  onOpen,
}: {
  invoice: FeeInvoice;
  canRecordPayment: boolean;
  onPay: () => void;
  onOpen: () => void;
}) {
  const payable =
    canRecordPayment &&
    (invoice.status === 'issued' || invoice.status === 'partial') &&
    invoice.balance > 0;

  return (
    <article className="panel p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <button type="button" className="min-w-0 flex-1 text-left" onClick={onOpen}>
          <div className="mb-2 flex flex-wrap gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusStyles[invoice.status]}`}
            >
              {invoice.status}
            </span>
            {invoice.periodLabel && (
              <span className="rounded-full bg-ink-50 px-2.5 py-1 text-xs font-medium text-ink-700">
                {invoice.periodLabel}
              </span>
            )}
          </div>
          <h2 className="font-display text-lg font-semibold text-ink-950">{invoice.title}</h2>
          <p className="mt-1 text-sm text-ink-700">
            {invoice.studentName}
            {invoice.admissionNo ? ` · ${invoice.admissionNo}` : ''}
            {invoice.className ? ` · ${invoice.className}` : ''}
            {invoice.sectionName ? `-${invoice.sectionName}` : ''}
          </p>
          <p className="mt-2 text-sm text-ink-700/70">
            Due {invoice.dueDate} · Paid {formatMoney(invoice.amountPaid)} of{' '}
            {formatMoney(invoice.amount)} · Balance {formatMoney(invoice.balance)}
          </p>
        </button>
        {payable && (
          <Button type="button" size="sm" onClick={onPay}>
            <Wallet className="h-4 w-4" aria-hidden="true" /> Record payment
          </Button>
        )}
      </div>
    </article>
  );
}

function CreateInvoiceModal({ onClose }: { onClose: () => void }) {
  const createInvoice = useCreateInvoice();
  const structuresQuery = useFeeStructures({ activeOnly: true });
  const studentsQuery = useStudents({ page: 1, limit: 100, status: 'active' });
  const [studentId, setStudentId] = useState('');
  const [feeStructureId, setFeeStructureId] = useState('');
  const [title, setTitle] = useState('');
  const [periodLabel, setPeriodLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  const structures = structuresQuery.data ?? [];
  const students = studentsQuery.data?.items ?? [];

  const onStructureChange = (id: string) => {
    setFeeStructureId(id);
    const structure = structures.find((item) => item.id === id);
    if (structure) {
      setAmount(String(structure.amount));
      if (!title.trim()) setTitle(structure.name);
    }
  };

  const submit = () => {
    if (!studentId || !dueDate) return;
    const parsedAmount = amount ? Number(amount) : undefined;
    createInvoice.mutate(
      {
        studentId,
        feeStructureId: feeStructureId || undefined,
        title: title.trim() || undefined,
        periodLabel: periodLabel.trim() || undefined,
        amount: parsedAmount,
        dueDate,
        notes: notes.trim() || undefined,
        issue: true,
      },
      { onSuccess: onClose },
    );
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="New invoice"
      description="Bill a student for a fee period."
      size="lg"
      closeDisabled={createInvoice.isPending}
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={createInvoice.isPending}>
            Cancel
          </Button>
          <Button type="button" onClick={submit} isLoading={createInvoice.isPending}>
            Create invoice
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="invoice-student" className="mb-1.5 block text-sm font-medium text-ink-800">
            Student *
          </label>
          <select
            id="invoice-student"
            className={selectClass}
            value={studentId}
            onChange={(event) => setStudentId(event.target.value)}
          >
            <option value="">Select student</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.fullName} ({student.admissionNo}) — {student.className}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="invoice-structure" className="mb-1.5 block text-sm font-medium text-ink-800">
            Fee structure
          </label>
          <select
            id="invoice-structure"
            className={selectClass}
            value={feeStructureId}
            onChange={(event) => onStructureChange(event.target.value)}
          >
            <option value="">Custom amount</option>
            {structures.map((structure) => (
              <option key={structure.id} value={structure.id}>
                {structure.name} — {formatMoney(structure.amount)}
              </option>
            ))}
          </select>
        </div>
        <Input label="Title" value={title} onChange={(event) => setTitle(event.target.value)} />
        <Input
          label="Period label"
          placeholder="e.g. March 2026"
          value={periodLabel}
          onChange={(event) => setPeriodLabel(event.target.value)}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Amount *"
            type="number"
            min={1}
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
          <Input
            label="Due date *"
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
          />
        </div>
        <Input label="Notes" value={notes} onChange={(event) => setNotes(event.target.value)} />
      </div>
    </Modal>
  );
}

function GenerateInvoicesModal({ onClose }: { onClose: () => void }) {
  const generate = useGenerateInvoices();
  const structuresQuery = useFeeStructures({ activeOnly: true });
  const classesQuery = useClasses();
  const [feeStructureId, setFeeStructureId] = useState('');
  const [classId, setClassId] = useState('');
  const [periodLabel, setPeriodLabel] = useState('');
  const [dueDate, setDueDate] = useState('');

  const structures = structuresQuery.data ?? [];
  const selected = useMemo(
    () => structures.find((item) => item.id === feeStructureId),
    [structures, feeStructureId],
  );

  const submit = () => {
    if (!feeStructureId || !periodLabel.trim() || !dueDate) return;
    generate.mutate(
      {
        feeStructureId,
        periodLabel: periodLabel.trim(),
        dueDate,
        classId: classId || selected?.classId || undefined,
      },
      { onSuccess: onClose },
    );
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Generate invoices"
      description="Create invoices for all active students in a class."
      size="lg"
      closeDisabled={generate.isPending}
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={generate.isPending}>
            Cancel
          </Button>
          <Button type="button" onClick={submit} isLoading={generate.isPending}>
            Generate
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="gen-structure" className="mb-1.5 block text-sm font-medium text-ink-800">
            Fee structure *
          </label>
          <select
            id="gen-structure"
            className={selectClass}
            value={feeStructureId}
            onChange={(event) => {
              setFeeStructureId(event.target.value);
              const structure = structures.find((item) => item.id === event.target.value);
              if (structure?.classId) setClassId(structure.classId);
            }}
          >
            <option value="">Select structure</option>
            {structures.map((structure) => (
              <option key={structure.id} value={structure.id}>
                {structure.name} — {formatMoney(structure.amount)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="gen-class" className="mb-1.5 block text-sm font-medium text-ink-800">
            Class {selected?.classId ? '' : '*'}
          </label>
          <select
            id="gen-class"
            className={selectClass}
            value={classId}
            onChange={(event) => setClassId(event.target.value)}
          >
            <option value="">Select class</option>
            {(classesQuery.data ?? []).map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
        <Input
          label="Period label *"
          placeholder="e.g. March 2026"
          value={periodLabel}
          onChange={(event) => setPeriodLabel(event.target.value)}
        />
        <Input
          label="Due date *"
          type="date"
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
        />
      </div>
    </Modal>
  );
}

function CreateStructureModal({ onClose }: { onClose: () => void }) {
  const create = useCreateFeeStructure();
  const classesQuery = useClasses();
  const [name, setName] = useState('');
  const [classId, setClassId] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<FeeFrequency>('monthly');
  const [description, setDescription] = useState('');

  const submit = () => {
    const parsed = Number(amount);
    if (name.trim().length < 2 || !Number.isFinite(parsed) || parsed <= 0) return;
    create.mutate(
      {
        name: name.trim(),
        classId: classId || null,
        amount: parsed,
        frequency,
        description: description.trim() || null,
      },
      { onSuccess: onClose },
    );
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="New fee structure"
      description="Define a reusable fee amount for a class."
      size="lg"
      closeDisabled={create.isPending}
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={create.isPending}>
            Cancel
          </Button>
          <Button type="button" onClick={submit} isLoading={create.isPending}>
            Save structure
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input label="Name *" value={name} onChange={(event) => setName(event.target.value)} />
        <div>
          <label htmlFor="structure-class" className="mb-1.5 block text-sm font-medium text-ink-800">
            Class
          </label>
          <select
            id="structure-class"
            className={selectClass}
            value={classId}
            onChange={(event) => setClassId(event.target.value)}
          >
            <option value="">Any class</option>
            {(classesQuery.data ?? []).map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Amount *"
            type="number"
            min={1}
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
          <div>
            <label htmlFor="structure-freq" className="mb-1.5 block text-sm font-medium text-ink-800">
              Frequency
            </label>
            <select
              id="structure-freq"
              className={selectClass}
              value={frequency}
              onChange={(event) => setFrequency(event.target.value as FeeFrequency)}
            >
              <option value="monthly">Monthly</option>
              <option value="term">Term</option>
              <option value="annual">Annual</option>
              <option value="one_time">One time</option>
            </select>
          </div>
        </div>
        <Input
          label="Description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>
    </Modal>
  );
}

function PaymentModal({ invoiceId, onClose }: { invoiceId: string; onClose: () => void }) {
  const invoiceQuery = useInvoice(invoiceId);
  const recordPayment = useRecordPayment();
  const invoice = invoiceQuery.data;
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  const submit = () => {
    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    recordPayment.mutate(
      {
        invoiceId,
        amount: parsed,
        method,
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
      },
      { onSuccess: onClose },
    );
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Record payment"
      description={
        invoice
          ? `${invoice.studentName ?? 'Student'} · balance ${formatMoney(invoice.balance)}`
          : 'Loading invoice…'
      }
      closeDisabled={recordPayment.isPending}
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={recordPayment.isPending}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={submit}
            isLoading={recordPayment.isPending}
            disabled={!invoice || recordPayment.isPending}
          >
            Save payment
          </Button>
        </>
      }
    >
      {invoiceQuery.isPending || !invoice ? (
        <PageLoader />
      ) : (
        <div className="space-y-4">
          <Input
            label="Amount *"
            type="number"
            min={1}
            max={invoice.balance}
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder={`Max ${formatMoney(invoice.balance)}`}
          />
          <div>
            <label htmlFor="pay-method" className="mb-1.5 block text-sm font-medium text-ink-800">
              Method
            </label>
            <select
              id="pay-method"
              className={selectClass}
              value={method}
              onChange={(event) => setMethod(event.target.value as PaymentMethod)}
            >
              <option value="cash">Cash</option>
              <option value="bank">Bank</option>
              <option value="cheque">Cheque</option>
              <option value="online">Online</option>
              <option value="other">Other</option>
            </select>
          </div>
          <Input
            label="Reference"
            value={reference}
            onChange={(event) => setReference(event.target.value)}
          />
          <Input label="Notes" value={notes} onChange={(event) => setNotes(event.target.value)} />
        </div>
      )}
    </Modal>
  );
}

function InvoiceDetailModal({
  invoiceId,
  canRefund,
  onClose,
}: {
  invoiceId: string;
  canRefund: boolean;
  onClose: () => void;
}) {
  const invoiceQuery = useInvoice(invoiceId);
  const voidPayment = useVoidPayment();
  const invoice = invoiceQuery.data;

  return (
    <Modal
      open
      onClose={onClose}
      title={invoice?.title ?? 'Invoice'}
      description={
        invoice
          ? `${invoice.studentName ?? ''} · ${invoice.status}`
          : 'Loading…'
      }
      size="lg"
      footer={
        <Button type="button" variant="outline" onClick={onClose}>
          Close
        </Button>
      }
    >
      {invoiceQuery.isPending || !invoice ? (
        <PageLoader />
      ) : (
        <div className="space-y-5">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-ink-700/70">Amount</dt>
              <dd className="font-medium text-ink-950">{formatMoney(invoice.amount)}</dd>
            </div>
            <div>
              <dt className="text-ink-700/70">Paid</dt>
              <dd className="font-medium text-ink-950">{formatMoney(invoice.amountPaid)}</dd>
            </div>
            <div>
              <dt className="text-ink-700/70">Balance</dt>
              <dd className="font-medium text-ink-950">{formatMoney(invoice.balance)}</dd>
            </div>
            <div>
              <dt className="text-ink-700/70">Due date</dt>
              <dd className="font-medium text-ink-950">{invoice.dueDate}</dd>
            </div>
          </dl>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-ink-950">Payments</h3>
            {(invoice.payments ?? []).length === 0 ? (
              <p className="text-sm text-ink-700/70">No payments recorded.</p>
            ) : (
              <ul className="space-y-2">
                {(invoice.payments ?? []).map((payment) => (
                  <li
                    key={payment.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-ink-100 px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium text-ink-950">
                        {formatMoney(payment.amount)} · {payment.method}
                      </p>
                      <p className="text-xs text-ink-700/60">
                        {new Date(payment.paidAt).toLocaleString()}
                        {payment.recordedByName ? ` · ${payment.recordedByName}` : ''}
                        {payment.reference ? ` · ${payment.reference}` : ''}
                      </p>
                    </div>
                    {canRefund && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (window.confirm('Void this payment?')) {
                            voidPayment.mutate(payment.id);
                          }
                        }}
                      >
                        Void
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
