import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Banknote, Download, Plus, Printer, Receipt, Search, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { FilterField, FiltersPanel } from '@/components/ui/filters-panel';
import { DateInput } from '@/components/ui/date-input';
import { Input } from '@/components/ui/input';
import { ListPagination } from '@/components/ui/list-pagination';
import { Modal } from '@/components/ui/modal';
import { PageShell } from '@/components/ui/page-shell';
import { RowActions } from '@/components/ui/row-actions';
import { PageLoader } from '@/components/ui/spinner';
import { usePermission } from '@/hooks/usePermission';
import { useTenantDateTime } from '@/hooks/useTenantDateTime';
import { buildQueryString } from '@/lib/api';
import { hasActiveFilters, resetListFilters } from '@/lib/list-filters';
import { downloadFile } from '@/lib/download';
import { useClasses } from '@/features/school/classes/hooks/useClasses';
import { useSections } from '@/features/school/classes/hooks/useSections';
import { useStudents } from '@/features/school/students/hooks/useStudents';
import { useSessionYears } from '@/features/school/session-years/hooks/useSessionYears';
import {
  useCreateFeeStructure,
  useCreateInvoice,
  useDeleteFeeStructure,
  useFeeStructurePreview,
  useFeeStructures,
  useGenerateInvoices,
  useFeeHeads,
  useInvoice,
  useInvoices,
  useRecordPayment,
  useVoidPayment,
  useUpdateFeeStructure,
  type FeeInvoice,
  type FeeStructure,
} from '../hooks/useFees';
import { MONTHS } from '../hooks/keys';
import type {
  FeeFrequency,
  InvoiceFilters,
  InvoiceStatus,
  PaymentMethod,
  ScheduleType,
} from '../hooks/keys';

function formatMoney(amount: number) {
  return new Intl.NumberFormat(undefined, {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(amount);
}

const statusTone: Record<InvoiceStatus, 'neutral' | 'warning' | 'primary' | 'success' | 'danger'> = {
  draft: 'neutral',
  issued: 'warning',
  partial: 'primary',
  paid: 'success',
  cancelled: 'danger',
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
  const [editingStructure, setEditingStructure] = useState<FeeStructure | null>(null);
  const [paymentInvoiceId, setPaymentInvoiceId] = useState<string | null>(null);
  const [detailInvoiceId, setDetailInvoiceId] = useState<string | null>(null);
  const [pendingStructureDelete, setPendingStructureDelete] = useState<FeeStructure | null>(null);
  const [previewStructure, setPreviewStructure] = useState<FeeStructure | null>(null);
  const [pendingVoidPaymentId, setPendingVoidPaymentId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const invoicesQuery = useInvoices(filters);
  const structuresQuery = useFeeStructures();
  const deleteStructure = useDeleteFeeStructure();
  const voidPayment = useVoidPayment();
  const classesQuery = useClasses();
  const invoiceSectionsQuery = useSections(filters.classId ?? '');

  const items = invoicesQuery.data?.items ?? [];
  const pagination = invoicesQuery.data?.pagination;
  const structures = useMemo(() => structuresQuery.data ?? [], [structuresQuery.data]);

  const handleExportInvoices = async () => {
    setExporting(true);
    try {
      await downloadFile(
        `/school/exports/invoices${buildQueryString({
          search: filters.search,
          status: filters.status,
          classId: filters.classId,
        })}`,
        'fee-invoices.csv',
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
          eyebrow="Finance"
          title="Fees"
          description="Structures, invoices, and payments."
          actions={
            <>
              {tab === 'invoices' && (
                <Button
                  variant="outline"
                  onClick={() => void handleExportInvoices()}
                  isLoading={exporting}
                >
                  <Download className="h-4 w-4" aria-hidden="true" /> Export CSV
                </Button>
              )}
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
            </>
          }
      >
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
            <FiltersPanel
              description="Find invoices by student, status, class, or section."
              pageLimit={filters.limit ?? 20}
              onPageLimitChange={(limit) =>
                setFilters((current) => ({ ...current, limit, page: 1 }))
              }
              onClear={() => setFilters((current) => resetListFilters(current))}
              clearDisabled={!hasActiveFilters(filters)}
            >
              <FilterField
                id="invoice-search"
                label="Search"
                icon={<Search className="h-3.5 w-3.5 text-ink-400" aria-hidden="true" />}
                className="md:col-span-5"
              >
                <Input
                  id="invoice-search"
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
              </FilterField>
              <FilterField id="invoice-status-filter" label="Status" className="md:col-span-3">
                <select
                  id="invoice-status-filter"
                  aria-label="Filter by status"
                  className="field-select"
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
              </FilterField>
              <FilterField id="invoice-class-filter" label="Class" className="md:col-span-4">
                <select
                  id="invoice-class-filter"
                  aria-label="Filter by class"
                  className="field-select"
                  value={filters.classId ?? ''}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      classId: event.target.value || undefined,
                      sectionId: undefined,
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
              </FilterField>
              <FilterField id="invoice-section-filter" label="Section" className="md:col-span-4">
                <select
                  id="invoice-section-filter"
                  aria-label="Filter by section"
                  className="field-select"
                  value={filters.sectionId ?? ''}
                  disabled={!filters.classId || invoiceSectionsQuery.isPending}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      sectionId: event.target.value || undefined,
                      page: 1,
                    }))
                  }
                >
                  <option value="">
                    {filters.classId ? 'All sections' : 'Select a class first'}
                  </option>
                  {(invoiceSectionsQuery.data ?? []).map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.name}
                    </option>
                  ))}
                </select>
              </FilterField>
            </FiltersPanel>

            {invoicesQuery.isPending ? (
              <div className="rounded-2xl bg-white shadow-sm ring-1 ring-ink-100">
                <PageLoader compact />
              </div>
            ) : invoicesQuery.error ? (
              <section className="rounded-2xl border border-danger-100 bg-white p-8 text-center shadow-sm">
                <h2 className="font-semibold text-ink-950">Failed to load invoices</h2>
                <p className="mt-2 text-sm text-ink-600">{invoicesQuery.error.message}</p>
              </section>
            ) : items.length === 0 ? (
              <EmptyState
                icon={Receipt}
                title="No invoices yet"
                description="Create an invoice or generate from a fee structure."
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
        ) : structuresQuery.isPending ? (
          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-ink-100">
            <PageLoader compact />
          </div>
        ) : structures.length === 0 ? (
          <EmptyState
            icon={Banknote}
            title="No fee structures"
            description="Define tuition or other recurring fees by class."
          />
        ) : (
          <div className="space-y-3">
            {structures.map((structure) => (
              <article
                key={structure.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ink-100"
              >
                <div>
                  <div className="mb-2 flex flex-wrap gap-2">
                    <Badge tone="primary" className="capitalize">
                      {structure.frequency.replace('_', ' ')}
                    </Badge>
                    <Badge tone={structure.isActive ? 'success' : 'neutral'}>
                      {structure.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <h2 className="font-display text-lg font-semibold text-ink-950">
                    {structure.name}
                  </h2>
                  <p className="mt-1 text-sm text-ink-600">
                    {structure.className ?? 'All classes'}
                    {structure.sectionName ? ` · Section ${structure.sectionName}` : ''}
                    {' · '}
                    {formatMoney(structure.amount)}
                  </p>
                  {structure.description && (
                    <p className="mt-2 text-sm text-ink-500">{structure.description}</p>
                  )}
                </div>
                <RowActions
                  onPreview={() => setPreviewStructure(structure)}
                  onEdit={
                    canEditStructure ? () => setEditingStructure(structure) : undefined
                  }
                  onDelete={
                    canEditStructure ? () => setPendingStructureDelete(structure) : undefined
                  }
                />
              </article>
            ))}
          </div>
        )}
      </PageShell>

      {creatingInvoice && <CreateInvoiceModal onClose={() => setCreatingInvoice(false)} />}
      {generating && <GenerateInvoicesModal onClose={() => setGenerating(false)} />}
      {creatingStructure && (
        <CreateStructureModal onClose={() => setCreatingStructure(false)} />
      )}
      {editingStructure && (
        <CreateStructureModal
          structure={editingStructure}
          onClose={() => setEditingStructure(null)}
        />
      )}
      {paymentInvoiceId && (
        <PaymentModal invoiceId={paymentInvoiceId} onClose={() => setPaymentInvoiceId(null)} />
      )}
      {detailInvoiceId && (
        <InvoiceDetailModal
          invoiceId={detailInvoiceId}
          canRefund={canRefund}
          onClose={() => setDetailInvoiceId(null)}
          onRequestVoid={(paymentId) => setPendingVoidPaymentId(paymentId)}
        />
      )}
      {previewStructure && (
        <StructurePreviewModal
          structure={previewStructure}
          onClose={() => setPreviewStructure(null)}
        />
      )}

      <ConfirmDialog
        open={Boolean(pendingStructureDelete)}
        title="Delete fee structure?"
        description={
          pendingStructureDelete
            ? `“${pendingStructureDelete.name}” will be removed from active structures.`
            : ''
        }
        confirmLabel="Delete structure"
        loading={deleteStructure.isPending}
        onClose={() => setPendingStructureDelete(null)}
        onConfirm={() => {
          if (!pendingStructureDelete) return;
          deleteStructure.mutate(pendingStructureDelete.id, {
            onSuccess: () => setPendingStructureDelete(null),
          });
        }}
      />

      <ConfirmDialog
        open={Boolean(pendingVoidPaymentId)}
        title="Void payment?"
        description="This payment will be voided and the invoice balance recalculated."
        confirmLabel="Void payment"
        loading={voidPayment.isPending}
        onClose={() => setPendingVoidPaymentId(null)}
        onConfirm={() => {
          if (!pendingVoidPaymentId) return;
          voidPayment.mutate(pendingVoidPaymentId, {
            onSuccess: () => setPendingVoidPaymentId(null),
          });
        }}
      />
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
  const { formatDate } = useTenantDateTime();
  const payable =
    canRecordPayment &&
    (invoice.status === 'issued' || invoice.status === 'partial') &&
    invoice.balance > 0;

  return (
    <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ink-100">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap gap-2">
            <Badge tone={statusTone[invoice.status]}>{invoice.status}</Badge>
            {invoice.periodLabel && <Badge tone="neutral">{invoice.periodLabel}</Badge>}
          </div>
          <h2 className="font-display text-lg font-semibold text-ink-950">{invoice.title}</h2>
          <p className="mt-1 text-sm text-ink-700">
            {invoice.studentName}
            {invoice.admissionNo ? ` · ${invoice.admissionNo}` : ''}
            {invoice.className ? ` · ${invoice.className}` : ''}
            {invoice.sectionName ? `-${invoice.sectionName}` : ''}
          </p>
          <p className="mt-2 text-sm text-ink-700/70">
            Due {formatDate(invoice.dueDate)} · Paid {formatMoney(invoice.amountPaid)} of{' '}
            {formatMoney(invoice.amount)} · Balance {formatMoney(invoice.balance)}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {payable ? (
            <Button type="button" size="sm" onClick={onPay}>
              <Wallet className="h-4 w-4" aria-hidden="true" /> Record payment
            </Button>
          ) : null}
          <RowActions onPreview={onOpen} />
        </div>
      </div>
    </article>
  );
}

function StructurePreviewModal({
  structure,
  onClose,
}: {
  structure: FeeStructure;
  onClose: () => void;
}) {
  return (
    <Modal
      open
      onClose={onClose}
      title={structure.name}
      description="Fee structure details"
      footer={
        <Button type="button" variant="outline" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <Badge tone="primary" className="capitalize">
          {structure.frequency.replace('_', ' ')}
        </Badge>
        <Badge tone={structure.isActive ? 'success' : 'neutral'}>
          {structure.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </div>
      <dl className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-ink-50/80 px-3 py-2.5 ring-1 ring-ink-100">
          <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">Amount</dt>
          <dd className="mt-1 text-sm font-medium text-ink-900">{formatMoney(structure.amount)}</dd>
        </div>
        <div className="rounded-xl bg-ink-50/80 px-3 py-2.5 ring-1 ring-ink-100">
          <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">Class</dt>
          <dd className="mt-1 text-sm font-medium text-ink-900">
            {structure.className ?? 'All classes'}
          </dd>
        </div>
        {structure.items.length > 0 && (
          <div className="rounded-xl bg-ink-50/80 px-3 py-3 ring-1 ring-ink-100 sm:col-span-2">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">
              Fee breakdown
            </h3>
            <ul className="mt-2 divide-y divide-ink-200 text-sm">
              {structure.items.map((item) => (
                <li key={item.id} className="flex justify-between gap-3 py-2">
                  <span className="text-ink-800">
                    {item.feeHeadName}{' '}
                    <span className="text-ink-500">({item.feeHeadCode})</span>
                    <span className="ml-2 text-xs capitalize text-ink-500">
                      {item.scheduleType.replace('_', ' ')}
                    </span>
                    {item.months.length > 0 && (
                      <span className="ml-2 text-xs text-ink-500">
                        {item.months
                          .map((month) => MONTHS.find((option) => option.value === month)?.label)
                          .filter(Boolean)
                          .join(', ')}
                      </span>
                    )}
                    {item.academicYear && (
                      <span className="ml-2 text-xs text-ink-500">{item.academicYear}</span>
                    )}
                  </span>
                  <span className="font-medium text-ink-900">{formatMoney(item.amount)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="rounded-xl bg-ink-50/80 px-3 py-2.5 ring-1 ring-ink-100 sm:col-span-2">
          <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">
            Description
          </dt>
          <dd className="mt-1 text-sm font-medium text-ink-900">
            {structure.description?.trim() || '—'}
          </dd>
        </div>
      </dl>
    </Modal>
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
            className="field-select"
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
            className="field-select"
            value={feeStructureId}
            onChange={(event) => onStructureChange(event.target.value)}
          >
            <option value="">Custom amount</option>
            {structures.map((structure) => (
              <option key={structure.id} value={structure.id}>
                {structure.name}
                {structure.className ? ` · ${structure.className}` : ''}
                {structure.sectionName ? ` · ${structure.sectionName}` : ''}
                {` — ${formatMoney(structure.amount)}`}
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
            disabled={Boolean(feeStructureId)}
          />
          <DateInput
            label="Due date *"
            value={dueDate}
            onChange={setDueDate}
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
  const [sectionId, setSectionId] = useState('');
  const [periodLabel, setPeriodLabel] = useState('');
  const [debouncedPeriodLabel, setDebouncedPeriodLabel] = useState('');
  const [dueDate, setDueDate] = useState('');

  const structures = useMemo(() => structuresQuery.data ?? [], [structuresQuery.data]);
  const sectionsQuery = useSections(classId);
  const selected = useMemo(
    () => structures.find((item) => item.id === feeStructureId),
    [structures, feeStructureId],
  );
  useEffect(() => {
    const timer = window.setTimeout(
      () => setDebouncedPeriodLabel(periodLabel.trim()),
      350,
    );
    return () => window.clearTimeout(timer);
  }, [periodLabel]);
  const previewQuery = useFeeStructurePreview(feeStructureId, debouncedPeriodLabel);
  const preview = previewQuery.data;

  const submit = () => {
    if (!feeStructureId || !periodLabel.trim() || !dueDate || !preview || preview.totalAmount <= 0) {
      return;
    }
    generate.mutate(
      {
        feeStructureId,
        periodLabel: periodLabel.trim(),
        dueDate,
        classId: classId || selected?.classId || undefined,
        sectionId: sectionId || selected?.sectionId || undefined,
      },
      { onSuccess: onClose },
    );
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Generate invoices"
      description="Create invoices for active students in a class or selected section."
      size="lg"
      closeDisabled={generate.isPending}
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={generate.isPending}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={submit}
            isLoading={generate.isPending}
            disabled={
              !preview ||
              preview.totalAmount <= 0 ||
              !dueDate ||
              previewQuery.isPending ||
              debouncedPeriodLabel !== periodLabel.trim()
            }
          >
            Generate invoices
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
            className="field-select"
            value={feeStructureId}
            onChange={(event) => {
              setFeeStructureId(event.target.value);
              const structure = structures.find((item) => item.id === event.target.value);
              setClassId(structure?.classId ?? '');
              setSectionId(structure?.sectionId ?? '');
            }}
          >
            <option value="">Select structure</option>
            {structures.map((structure) => (
              <option key={structure.id} value={structure.id}>
                {structure.name}
                {structure.className ? ` · ${structure.className}` : ''}
                {structure.sectionName ? ` · ${structure.sectionName}` : ''}
                {` — ${formatMoney(structure.amount)}`}
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
            className="field-select"
            value={classId}
            disabled={Boolean(selected?.classId)}
            onChange={(event) => {
              setClassId(event.target.value);
              setSectionId('');
            }}
          >
            <option value="">Select class</option>
            {(classesQuery.data ?? []).map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="gen-section" className="mb-1.5 block text-sm font-medium text-ink-800">
            Section
          </label>
          <select
            id="gen-section"
            className="field-select"
            value={sectionId}
            disabled={!classId || sectionsQuery.isPending || Boolean(selected?.sectionId)}
            onChange={(event) => setSectionId(event.target.value)}
          >
            <option value="">All sections</option>
            {(sectionsQuery.data ?? []).map((section) => (
              <option key={section.id} value={section.id}>
                {section.name}
              </option>
            ))}
          </select>
        </div>
        <Input
          label="Period label *"
          placeholder="e.g. October 2026"
          value={periodLabel}
          onChange={(event) => setPeriodLabel(event.target.value)}
        />
        <p className="-mt-3 text-xs text-ink-500">
          Include a month name, such as October 2026, to preview scheduled items.
        </p>
        {feeStructureId && periodLabel.trim() && (
          <section className="rounded-xl bg-ink-50 p-4 ring-1 ring-ink-200">
            <h3 className="mb-2 text-sm font-semibold text-ink-900">
              Preview for {periodLabel.trim()}
            </h3>
            {previewQuery.isPending || debouncedPeriodLabel !== periodLabel.trim() ? (
              <PageLoader compact />
            ) : previewQuery.error ? (
              <p className="text-sm text-danger-700">{previewQuery.error.message}</p>
            ) : preview ? (
              <>
                {preview.items.length === 0 ? (
                  <p className="text-sm text-ink-700">
                    Legacy structure total: {formatMoney(preview.totalAmount)}
                  </p>
                ) : (
                  <ul className="space-y-1.5 text-sm">
                    {preview.items.map((item) => (
                      <li key={item.id} className="flex justify-between gap-3">
                        <span className={item.isIncluded ? 'text-ink-800' : 'text-ink-400 line-through'}>
                          {item.isIncluded ? 'Included · ' : 'Skipped · '}
                          {item.feeHeadName}
                        </span>
                        <span
                          className={
                            item.isIncluded
                              ? 'font-medium text-ink-900'
                              : 'text-ink-400 line-through'
                          }
                        >
                          {formatMoney(item.amount)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-3 flex justify-between border-t border-ink-200 pt-3 text-sm font-semibold">
                  <span>Total per student</span>
                  <span>{formatMoney(preview.totalAmount)}</span>
                </div>
                {preview.totalAmount === 0 && (
                  <p className="mt-2 text-sm text-danger-700">
                    No fee items are scheduled for this period. Invoice generation is disabled.
                  </p>
                )}
              </>
            ) : null}
          </section>
        )}
        <DateInput
          label="Due date *"
          value={dueDate}
          onChange={setDueDate}
        />
      </div>
    </Modal>
  );
}

function CreateStructureModal({
  structure,
  onClose,
}: {
  structure?: FeeStructure;
  onClose: () => void;
}) {
  type StructureItemDraft = {
    feeHeadId: string;
    amount: string;
    scheduleType: ScheduleType;
    months: number[];
    academicYear: string;
  };
  const create = useCreateFeeStructure();
  const update = useUpdateFeeStructure();
  const classesQuery = useClasses();
  const feeHeadsQuery = useFeeHeads({ activeOnly: true });
  const sessionYearsQuery = useSessionYears();
  const [name, setName] = useState(structure?.name ?? '');
  const [classId, setClassId] = useState(structure?.classId ?? '');
  const [sectionId, setSectionId] = useState(structure?.sectionId ?? '');
  const [items, setItems] = useState<StructureItemDraft[]>(
    structure?.items.map((item) => ({
      feeHeadId: item.feeHeadId,
      amount: String(item.amount),
      scheduleType: item.scheduleType,
      months: item.months,
      academicYear: item.academicYear ?? '',
    })) ?? [
      { feeHeadId: '', amount: '', scheduleType: 'monthly', months: [], academicYear: '' },
    ],
  );
  const [frequency, setFrequency] = useState<FeeFrequency>(structure?.frequency ?? 'monthly');
  const [description, setDescription] = useState(structure?.description ?? '');
  const [isActive, setIsActive] = useState(structure?.isActive ?? true);
  const isPending = create.isPending || update.isPending;
  const sectionsQuery = useSections(classId);
  const feeHeads = feeHeadsQuery.data ?? [];
  const selectedFeeHeadIds = items.map((item) => item.feeHeadId).filter(Boolean);
  const parsedItems = items.map((item) => ({
    feeHeadId: item.feeHeadId,
    amount: Number(item.amount),
    scheduleType: item.scheduleType,
    ...(item.scheduleType !== 'monthly' ? { months: item.months } : {}),
    ...(item.academicYear.trim() ? { academicYear: item.academicYear.trim() } : {}),
  }));
  const total = parsedItems.reduce((sum, item) => sum + (Number.isFinite(item.amount) ? item.amount : 0), 0);
  const validItems =
    items.length > 0 &&
    items.every(
      (item) =>
        item.feeHeadId &&
        Number.isSafeInteger(Number(item.amount)) &&
        Number(item.amount) > 0 &&
        (item.scheduleType === 'monthly' ||
          (item.scheduleType === 'specific_months' && item.months.length > 0) ||
          (item.scheduleType === 'one_time' && item.months.length === 1)),
    ) &&
    new Set(selectedFeeHeadIds).size === items.length &&
    total <= 2_147_483_647;

  const submit = () => {
    const data = {
      name: name.trim(),
      classId: classId || null,
      sectionId: sectionId || null,
      items: parsedItems,
      frequency,
      description: description.trim() || null,
    };
    if (structure) {
      update.mutate({ id: structure.id, ...data, isActive }, { onSuccess: onClose });
    } else {
      create.mutate(data, { onSuccess: onClose });
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={structure ? 'Edit fee structure' : 'New fee structure'}
      description={
        structure
          ? 'Update the structure details, fee items, and schedules.'
          : 'Compose a reusable fee structure from fee heads.'
      }
      size="lg"
      closeDisabled={isPending}
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={submit}
            isLoading={isPending}
            disabled={name.trim().length < 2 || !validItems || feeHeadsQuery.isPending}
          >
            {structure ? 'Save changes' : 'Save structure'}
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
            className="field-select"
            value={classId}
            onChange={(event) => {
              setClassId(event.target.value);
              setSectionId('');
            }}
          >
            <option value="">Any class</option>
            {(classesQuery.data ?? []).map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
        {classId && (
          <div>
            <label
              htmlFor="structure-section"
              className="mb-1.5 block text-sm font-medium text-ink-800"
            >
              Section
            </label>
            <select
              id="structure-section"
              className="field-select"
              value={sectionId}
              onChange={(event) => setSectionId(event.target.value)}
              disabled={sectionsQuery.isPending}
            >
              <option value="">All sections in class</option>
              {(sectionsQuery.data ?? []).map((section) => (
                <option key={section.id} value={section.id}>
                  {section.name}
                </option>
              ))}
            </select>
            {sectionsQuery.error && (
              <p className="mt-1 text-sm text-danger-600">{sectionsQuery.error.message}</p>
            )}
          </div>
        )}
        <section className="space-y-3 rounded-xl border border-ink-200 p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-ink-900">Fee heads *</h3>
              <p className="text-xs text-ink-500">Each head contributes to the total.</p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                setItems((current) => [
                  ...current,
                  {
                    feeHeadId: '',
                    amount: '',
                    scheduleType: 'monthly',
                    months: [],
                    academicYear: '',
                  },
                ])
              }
              disabled={feeHeads.length === 0}
            >
              <Plus className="h-4 w-4" aria-hidden="true" /> Add item
            </Button>
          </div>
          {feeHeadsQuery.isPending ? (
            <p className="text-sm text-ink-500">Loading fee heads...</p>
          ) : feeHeadsQuery.error ? (
            <p className="text-sm text-danger-600">{feeHeadsQuery.error.message}</p>
          ) : feeHeads.length === 0 ? (
            <p className="text-sm text-ink-500">
              No active fee heads. Create a fee head before setting up a structure.
            </p>
          ) : (
            items.map((item, index) => (
              <div key={index} className="space-y-3 rounded-xl border border-ink-200 p-3">
                <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                  <div>
                  <label
                    htmlFor={`structure-head-${index}`}
                    className="mb-1 block text-xs font-medium text-ink-700"
                  >
                    Fee head
                  </label>
                  <select
                    id={`structure-head-${index}`}
                    className="field-select"
                    value={item.feeHeadId}
                    onChange={(event) =>
                      setItems((current) =>
                        current.map((row, rowIndex) =>
                          rowIndex === index ? { ...row, feeHeadId: event.target.value } : row,
                        ),
                      )
                    }
                  >
                    <option value="">Select fee head</option>
                    {feeHeads.map((head) => (
                      <option
                        key={head.id}
                        value={head.id}
                        disabled={head.id !== item.feeHeadId && selectedFeeHeadIds.includes(head.id)}
                      >
                        {head.name} ({head.code})
                      </option>
                    ))}
                  </select>
                  </div>
                  <Input
                    label="Amount"
                    type="number"
                    min={1}
                    step={1}
                    value={item.amount}
                    onChange={(event) =>
                      setItems((current) =>
                        current.map((row, rowIndex) =>
                          rowIndex === index ? { ...row, amount: event.target.value } : row,
                        ),
                      )
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    className="self-end"
                    aria-label={`Remove fee item ${index + 1}`}
                    disabled={items.length === 1}
                    onClick={() =>
                      setItems((current) => current.filter((_, rowIndex) => rowIndex !== index))
                    }
                  >
                    Remove
                  </Button>
                </div>
                <div>
                  <label
                    htmlFor={`structure-schedule-${index}`}
                    className="mb-1 block text-xs font-medium text-ink-700"
                  >
                    Schedule
                  </label>
                  <select
                    id={`structure-schedule-${index}`}
                    className="field-select"
                    value={item.scheduleType}
                    onChange={(event) => {
                      const scheduleType = event.target.value as ScheduleType;
                      setItems((current) =>
                        current.map((row, rowIndex) =>
                          rowIndex === index
                            ? {
                                ...row,
                                scheduleType,
                                months: scheduleType === 'monthly' ? [] : row.months,
                                academicYear:
                                  scheduleType === 'monthly' ? '' : row.academicYear,
                              }
                            : row,
                        ),
                      );
                    }}
                  >
                    <option value="monthly">Monthly (every month)</option>
                    <option value="specific_months">Specific months</option>
                    <option value="one_time">One time</option>
                  </select>
                </div>
                {item.scheduleType !== 'monthly' && (
                  <>
                    <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                      {MONTHS.map((month) => {
                        const selected = item.months.includes(month.value);
                        return (
                          <button
                            key={month.value}
                            type="button"
                            aria-pressed={selected}
                            onClick={() =>
                              setItems((current) =>
                                current.map((row, rowIndex) => {
                                  if (rowIndex !== index) return row;
                                  if (
                                    row.scheduleType === 'one_time' &&
                                    !row.months.includes(month.value)
                                  ) {
                                    return { ...row, months: [month.value] };
                                  }
                                  return {
                                    ...row,
                                    months: selected
                                      ? row.months.filter((value) => value !== month.value)
                                      : [...row.months, month.value].sort((a, b) => a - b),
                                  };
                                }),
                              )
                            }
                            className={`rounded-lg border px-3 py-2 text-xs font-medium ${
                              selected
                                ? 'border-primary-600 bg-primary-600 text-white'
                                : 'border-ink-200 bg-white text-ink-700'
                            }`}
                          >
                            {month.label}
                          </button>
                        );
                      })}
                    </div>
                    <div>
                      <label
                        htmlFor={`structure-academic-year-${index}`}
                        className="mb-1 block text-xs font-medium text-ink-700"
                      >
                        Academic session (optional)
                      </label>
                      <select
                        id={`structure-academic-year-${index}`}
                        className="field-select"
                        value={item.academicYear}
                        disabled={sessionYearsQuery.isPending}
                        onChange={(event) =>
                          setItems((current) =>
                            current.map((row, rowIndex) =>
                              rowIndex === index
                                ? { ...row, academicYear: event.target.value }
                                : row,
                            ),
                          )
                        }
                      >
                        <option value="">All academic sessions</option>
                        {(sessionYearsQuery.data ?? []).map((sessionYear) => (
                          <option key={sessionYear.id} value={sessionYear.name}>
                            {sessionYear.name}
                          </option>
                        ))}
                      </select>
                      {sessionYearsQuery.error && (
                        <p className="mt-1 text-xs text-danger-600">
                          {sessionYearsQuery.error.message}
                        </p>
                      )}
                    </div>
                    {item.scheduleType === 'one_time' && item.months.length !== 1 && (
                      <p className="text-xs text-danger-600">
                        Select exactly one month for a one-time fee.
                      </p>
                    )}
                  </>
                )}
              </div>
            ))
          )}
          {items.length > 0 && (
            <div className="flex justify-between border-t border-ink-200 pt-3 text-sm">
              <span className="font-medium text-ink-700">Total</span>
              <span className="font-semibold text-ink-950">{formatMoney(total)}</span>
            </div>
          )}
          {total > 2_147_483_647 && (
            <p className="text-sm text-danger-600">The total fee amount is too large.</p>
          )}
        </section>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="structure-freq" className="mb-1.5 block text-sm font-medium text-ink-800">
              Frequency
            </label>
            <select
              id="structure-freq"
              className="field-select"
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
        {structure && (
          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
              className="h-4 w-4 rounded border-ink-300 text-primary-600 focus:ring-primary-500"
            />
            Active fee structure
          </label>
        )}
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
              className="field-select"
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
  onRequestVoid,
}: {
  invoiceId: string;
  canRefund: boolean;
  onClose: () => void;
  onRequestVoid: (paymentId: string) => void;
}) {
  const { formatDate, formatDateTime } = useTenantDateTime();
  const invoiceQuery = useInvoice(invoiceId);
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
        <>
          {invoiceId ? (
            <Link
              to={`/fees/vouchers/${invoiceId}`}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium text-ink-900 hover:bg-ink-50"
            >
              <Printer className="h-4 w-4" aria-hidden="true" /> Print voucher
            </Link>
          ) : null}
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        </>
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
              <dd className="font-medium text-ink-950">{formatDate(invoice.dueDate)}</dd>
            </div>
          </dl>

          {(invoice.items ?? []).length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-ink-950">Fee breakdown</h3>
              <ul className="space-y-2">
                {invoice.items?.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-ink-100 px-3 py-2 text-sm"
                  >
                    <span className="text-ink-700">{item.name}</span>
                    <span className="font-medium text-ink-950">
                      {formatMoney(item.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

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
                        {formatDateTime(payment.paidAt)}
                        {payment.recordedByName ? ` · ${payment.recordedByName}` : ''}
                        {payment.reference ? ` · ${payment.reference}` : ''}
                      </p>
                    </div>
                    {canRefund && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => onRequestVoid(payment.id)}
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
