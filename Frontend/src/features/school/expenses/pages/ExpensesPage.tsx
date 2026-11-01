import { useState } from 'react';
import { Pencil, Plus, Receipt, Trash2, Wallet } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { PageHeader } from '@/components/ui/page-header';
import { PageLoader } from '@/components/ui/spinner';
import { usePermission } from '@/hooks/usePermission';
import {
  useCreateExpense,
  useCreateExpenseCategory,
  useDeleteExpense,
  useDeleteExpenseCategory,
  useExpenseCategories,
  useExpenses,
  useUpdateExpense,
  useUpdateExpenseCategory,
  type Expense,
  type ExpenseCategory,
} from '../hooks/useExpenses';
import type {
  ExpenseFilters,
  ExpensePaymentMethod,
  ExpenseStatus,
} from '../hooks/keys';

type Tab = 'expenses' | 'categories';

function formatMoney(amount: number) {
  return new Intl.NumberFormat(undefined, {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(amount);
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function ExpensesPage() {
  const { can } = usePermission();
  const canCreate = can('expenses.create');
  const canUpdate = can('expenses.update');
  const canDelete = can('expenses.delete');
  const canManageCategories = can('expenses.categories.manage');

  const [tab, setTab] = useState<Tab>('expenses');
  const [filters, setFilters] = useState<ExpenseFilters>({ page: 1, limit: 20 });
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState<Expense | null>(null);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<ExpenseCategory | null>(null);

  const expensesQuery = useExpenses(filters);
  const categoriesQuery = useExpenseCategories();
  const deleteExpense = useDeleteExpense();
  const updateExpense = useUpdateExpense();
  const deleteCategory = useDeleteExpenseCategory();

  const items = expensesQuery.data?.items ?? [];
  const summary = expensesQuery.data?.summary;
  const pagination = expensesQuery.data?.pagination;
  const categories = categoriesQuery.data ?? [];

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Finance"
          title="Expenses"
          description="Track school spending by category, vendor, and payment method."
          actions={
            tab === 'expenses' && canCreate ? (
              <Button onClick={() => setCreating(true)}>
                <Plus className="h-4 w-4" aria-hidden="true" /> Record expense
              </Button>
            ) : tab === 'categories' && canManageCategories ? (
              <Button onClick={() => setCreatingCategory(true)}>
                <Plus className="h-4 w-4" aria-hidden="true" /> Add category
              </Button>
            ) : undefined
          }
        />

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={tab === 'expenses' ? 'primary' : 'outline'}
            onClick={() => setTab('expenses')}
          >
            <Wallet className="h-4 w-4" aria-hidden="true" /> Expenses
          </Button>
          <Button
            type="button"
            size="sm"
            variant={tab === 'categories' ? 'primary' : 'outline'}
            onClick={() => setTab('categories')}
          >
            <Receipt className="h-4 w-4" aria-hidden="true" /> Categories
          </Button>
        </div>

        {tab === 'expenses' ? (
          <>
            {summary ? (
              <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="panel p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
                    Recorded total
                  </p>
                  <p className="mt-1 font-display text-2xl font-semibold text-ink-950">
                    {formatMoney(summary.totalAmount)}
                  </p>
                </div>
                <div className="panel p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
                    Recorded
                  </p>
                  <p className="mt-1 font-display text-2xl font-semibold text-ink-950">
                    {summary.recordedCount}
                  </p>
                </div>
                <div className="panel p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-ink-400">Voided</p>
                  <p className="mt-1 font-display text-2xl font-semibold text-ink-950">
                    {summary.voidCount}
                  </p>
                </div>
              </section>
            ) : null}

            <section className="panel grid grid-cols-1 gap-3 p-4 md:grid-cols-12">
              <div className="md:col-span-4">
                <Input
                  type="search"
                  aria-label="Search expenses"
                  placeholder="Search title, vendor, reference..."
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
                aria-label="Filter by category"
                className="field-select md:col-span-2"
                value={filters.categoryId ?? ''}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    categoryId: event.target.value || undefined,
                    page: 1,
                  }))
                }
              >
                <option value="">All categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <select
                aria-label="Filter by payment method"
                className="field-select md:col-span-2"
                value={filters.paymentMethod ?? ''}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    paymentMethod: (event.target.value || undefined) as
                      | ExpensePaymentMethod
                      | undefined,
                    page: 1,
                  }))
                }
              >
                <option value="">All methods</option>
                <option value="cash">Cash</option>
                <option value="bank">Bank</option>
                <option value="cheque">Cheque</option>
                <option value="online">Online</option>
                <option value="other">Other</option>
              </select>
              <select
                aria-label="Filter by status"
                className="field-select md:col-span-2"
                value={filters.status ?? ''}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    status: (event.target.value || undefined) as ExpenseStatus | undefined,
                    page: 1,
                  }))
                }
              >
                <option value="">All statuses</option>
                <option value="recorded">Recorded</option>
                <option value="void">Void</option>
              </select>
              <div className="md:col-span-1">
                <Input
                  type="date"
                  aria-label="From date"
                  value={filters.fromDate ?? ''}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      fromDate: event.target.value || undefined,
                      page: 1,
                    }))
                  }
                />
              </div>
              <div className="md:col-span-1">
                <Input
                  type="date"
                  aria-label="To date"
                  value={filters.toDate ?? ''}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      toDate: event.target.value || undefined,
                      page: 1,
                    }))
                  }
                />
              </div>
            </section>

            {expensesQuery.isPending ? (
              <div className="panel">
                <PageLoader compact />
              </div>
            ) : expensesQuery.error ? (
              <section className="panel border-danger-100 p-8 text-center">
                <h2 className="font-display font-semibold text-ink-950">Failed to load expenses</h2>
                <p className="mt-2 text-sm text-ink-600">{expensesQuery.error.message}</p>
              </section>
            ) : items.length === 0 ? (
              <EmptyState
                icon={Wallet}
                title="No expenses yet"
                description="Record salaries, utilities, supplies, and other school costs."
                action={
                  canCreate ? (
                    <Button onClick={() => setCreating(true)}>
                      <Plus className="h-4 w-4" aria-hidden="true" /> Record expense
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <section className="panel overflow-hidden p-0">
                <ul className="divide-y divide-ink-100">
                  {items.map((expense) => (
                    <li
                      key={expense.id}
                      className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                    >
                      <div className="min-w-0">
                        <div className="mb-1.5 flex flex-wrap gap-2">
                          <Badge tone={expense.status === 'void' ? 'neutral' : 'success'}>
                            {expense.status}
                          </Badge>
                          {expense.categoryName ? (
                            <Badge tone="primary">{expense.categoryName}</Badge>
                          ) : null}
                          <Badge tone="neutral">{expense.paymentMethod}</Badge>
                        </div>
                        <p className="font-display text-base font-semibold text-ink-950">
                          {expense.title}
                        </p>
                        <p className="mt-1 text-sm text-ink-600">
                          {formatMoney(expense.amount)} · {expense.expenseDate}
                          {expense.vendor ? ` · ${expense.vendor}` : ''}
                        </p>
                        {expense.notes ? (
                          <p className="mt-1 line-clamp-2 text-xs text-ink-400">{expense.notes}</p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {canUpdate && expense.status === 'recorded' ? (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => setEditing(expense)}
                            >
                              <Pencil className="h-4 w-4" aria-hidden="true" /> Edit
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                updateExpense.mutate({ id: expense.id, status: 'void' })
                              }
                            >
                              Void
                            </Button>
                          </>
                        ) : null}
                        {canUpdate && expense.status === 'void' ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              updateExpense.mutate({ id: expense.id, status: 'recorded' })
                            }
                          >
                            Restore
                          </Button>
                        ) : null}
                        {canDelete ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleting(expense)}
                            aria-label="Delete expense"
                          >
                            <Trash2 className="h-4 w-4 text-danger-600" aria-hidden="true" />
                          </Button>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {pagination && pagination.totalPages > 1 ? (
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
                      setFilters((current) => ({
                        ...current,
                        page: (current.page ?? 1) - 1,
                      }))
                    }
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() =>
                      setFilters((current) => ({
                        ...current,
                        page: (current.page ?? 1) + 1,
                      }))
                    }
                  >
                    Next
                  </Button>
                </div>
              </footer>
            ) : null}
          </>
        ) : (
          <>
            {categoriesQuery.isPending ? (
              <div className="panel">
                <PageLoader compact />
              </div>
            ) : categoriesQuery.error ? (
              <section className="panel border-danger-100 p-8 text-center">
                <h2 className="font-display font-semibold text-ink-950">
                  Failed to load categories
                </h2>
                <p className="mt-2 text-sm text-ink-600">{categoriesQuery.error.message}</p>
              </section>
            ) : categories.length === 0 ? (
              <EmptyState
                icon={Receipt}
                title="No categories"
                description="Add categories like Salaries, Utilities, or Supplies."
                action={
                  canManageCategories ? (
                    <Button onClick={() => setCreatingCategory(true)}>
                      <Plus className="h-4 w-4" aria-hidden="true" /> Add category
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <section className="panel overflow-hidden p-0">
                <ul className="divide-y divide-ink-100">
                  {categories.map((category) => (
                    <li
                      key={category.id}
                      className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                    >
                      <div>
                        <div className="mb-1 flex flex-wrap gap-2">
                          <Badge tone={category.isActive ? 'success' : 'neutral'}>
                            {category.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <p className="font-display text-base font-semibold text-ink-950">
                          {category.name}
                        </p>
                        {category.description ? (
                          <p className="mt-1 text-sm text-ink-500">{category.description}</p>
                        ) : null}
                      </div>
                      {canManageCategories ? (
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingCategory(category)}
                          >
                            <Pencil className="h-4 w-4" aria-hidden="true" /> Edit
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeletingCategory(category)}
                            aria-label="Delete category"
                          >
                            <Trash2 className="h-4 w-4 text-danger-600" aria-hidden="true" />
                          </Button>
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </div>

      {creating ? (
        <ExpenseFormModal
          categories={categories}
          onClose={() => setCreating(false)}
        />
      ) : null}

      {editing ? (
        <ExpenseFormModal
          expense={editing}
          categories={categories}
          onClose={() => setEditing(null)}
        />
      ) : null}

      {(creatingCategory || editingCategory) && (
        <CategoryFormModal
          category={editingCategory}
          onClose={() => {
            setCreatingCategory(false);
            setEditingCategory(null);
          }}
        />
      )}

      <ConfirmDialog
        open={deleting !== null}
        title="Delete expense"
        description={deleting ? `Delete expense "${deleting.title}"?` : ''}
        confirmLabel="Delete"
        loading={deleteExpense.isPending}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return;
          deleteExpense.mutate(deleting.id, { onSettled: () => setDeleting(null) });
        }}
      />

      <ConfirmDialog
        open={deletingCategory !== null}
        title="Delete category"
        description={
          deletingCategory
            ? `Delete category "${deletingCategory.name}"? Existing expenses keep their amounts.`
            : ''
        }
        confirmLabel="Delete"
        loading={deleteCategory.isPending}
        onClose={() => setDeletingCategory(null)}
        onConfirm={() => {
          if (!deletingCategory) return;
          deleteCategory.mutate(deletingCategory.id, {
            onSettled: () => setDeletingCategory(null),
          });
        }}
      />
    </AppLayout>
  );
}

function ExpenseFormModal({
  expense,
  categories,
  onClose,
}: {
  expense?: Expense;
  categories: ExpenseCategory[];
  onClose: () => void;
}) {
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const isEdit = Boolean(expense);
  const pending = createExpense.isPending || updateExpense.isPending;

  const [title, setTitle] = useState(expense?.title ?? '');
  const [amount, setAmount] = useState(expense ? String(expense.amount) : '');
  const [expenseDate, setExpenseDate] = useState(expense?.expenseDate ?? todayIso());
  const [categoryId, setCategoryId] = useState(expense?.categoryId ?? '');
  const [paymentMethod, setPaymentMethod] = useState<ExpensePaymentMethod>(
    (expense?.paymentMethod as ExpensePaymentMethod) ?? 'cash',
  );
  const [vendor, setVendor] = useState(expense?.vendor ?? '');
  const [reference, setReference] = useState(expense?.reference ?? '');
  const [notes, setNotes] = useState(expense?.notes ?? '');

  const submit = () => {
    const parsedAmount = Number(amount);
    if (title.trim().length < 2 || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return;
    }

    const payload = {
      title: title.trim(),
      amount: Math.round(parsedAmount),
      expenseDate,
      categoryId: categoryId || null,
      paymentMethod,
      vendor: vendor.trim() || null,
      reference: reference.trim() || null,
      notes: notes.trim() || null,
    };

    if (isEdit && expense) {
      updateExpense.mutate({ id: expense.id, ...payload }, { onSuccess: onClose });
      return;
    }

    createExpense.mutate(payload, { onSuccess: onClose });
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? 'Edit expense' : 'Record expense'}
      description="Amounts are stored as whole currency units."
      size="lg"
      closeDisabled={pending}
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="button" onClick={submit} isLoading={pending}>
            {isEdit ? 'Save changes' : 'Save expense'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          label="Title *"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="e.g. Electricity bill — March"
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Amount *"
            type="number"
            min={1}
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
          <Input
            label="Date *"
            type="date"
            value={expenseDate}
            onChange={(event) => setExpenseDate(event.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="expense-category" className="mb-1.5 block text-sm font-medium text-ink-800">
              Category
            </label>
            <select
              id="expense-category"
              className="field-select"
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
            >
              <option value="">Uncategorized</option>
              {categories
                .filter((category) => category.isActive || category.id === categoryId)
                .map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="expense-method"
              className="mb-1.5 block text-sm font-medium text-ink-800"
            >
              Payment method
            </label>
            <select
              id="expense-method"
              className="field-select"
              value={paymentMethod}
              onChange={(event) =>
                setPaymentMethod(event.target.value as ExpensePaymentMethod)
              }
            >
              <option value="cash">Cash</option>
              <option value="bank">Bank</option>
              <option value="cheque">Cheque</option>
              <option value="online">Online</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Vendor"
            value={vendor}
            onChange={(event) => setVendor(event.target.value)}
          />
          <Input
            label="Reference"
            value={reference}
            onChange={(event) => setReference(event.target.value)}
            placeholder="Cheque / receipt no."
          />
        </div>
        <div>
          <label htmlFor="expense-notes" className="mb-1.5 block text-sm font-medium text-ink-800">
            Notes
          </label>
          <textarea
            id="expense-notes"
            rows={3}
            className="field-select"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}

function CategoryFormModal({
  category,
  onClose,
}: {
  category: ExpenseCategory | null;
  onClose: () => void;
}) {
  const createCategory = useCreateExpenseCategory();
  const updateCategory = useUpdateExpenseCategory();
  const isEdit = Boolean(category);
  const pending = createCategory.isPending || updateCategory.isPending;

  const [name, setName] = useState(category?.name ?? '');
  const [description, setDescription] = useState(category?.description ?? '');
  const [isActive, setIsActive] = useState(category?.isActive ?? true);

  const submit = () => {
    if (name.trim().length < 2) return;
    if (isEdit && category) {
      updateCategory.mutate(
        {
          id: category.id,
          name: name.trim(),
          description: description.trim() || null,
          isActive,
        },
        { onSuccess: onClose },
      );
      return;
    }
    createCategory.mutate(
      { name: name.trim(), description: description.trim() || null },
      { onSuccess: onClose },
    );
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? 'Edit category' : 'Add category'}
      closeDisabled={pending}
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="button" onClick={submit} isLoading={pending}>
            {isEdit ? 'Save changes' : 'Create category'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          label="Name *"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <div>
          <label
            htmlFor="category-description"
            className="mb-1.5 block text-sm font-medium text-ink-800"
          >
            Description
          </label>
          <textarea
            id="category-description"
            rows={3}
            className="field-select"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>
        {isEdit ? (
          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
              className="rounded border-ink-300"
            />
            Active
          </label>
        ) : null}
      </div>
    </Modal>
  );
}
