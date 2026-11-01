export const EXPENSE_PAYMENT_METHODS = [
  'cash',
  'bank',
  'cheque',
  'online',
  'other',
] as const;
export type ExpensePaymentMethod = (typeof EXPENSE_PAYMENT_METHODS)[number];

export const EXPENSE_STATUSES = ['recorded', 'void'] as const;
export type ExpenseStatus = (typeof EXPENSE_STATUSES)[number];

export const DEFAULT_EXPENSE_CATEGORIES = [
  'Salaries',
  'Utilities',
  'Rent',
  'Supplies',
  'Maintenance',
  'Transport',
  'Events',
  'Other',
] as const;

export interface ListExpenseCategoriesFilters {
  tenantId: string;
  activeOnly?: boolean;
}

export interface CreateExpenseCategoryData {
  name: string;
  description?: string | null;
}

export interface UpdateExpenseCategoryData {
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

export interface ListExpensesFilters {
  tenantId: string;
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  paymentMethod?: ExpensePaymentMethod;
  status?: ExpenseStatus;
  fromDate?: string;
  toDate?: string;
}

export interface CreateExpenseData {
  title: string;
  amount: number;
  expenseDate: string;
  categoryId?: string | null;
  paymentMethod?: ExpensePaymentMethod;
  vendor?: string | null;
  reference?: string | null;
  notes?: string | null;
}

export interface UpdateExpenseData {
  title?: string;
  amount?: number;
  expenseDate?: string;
  categoryId?: string | null;
  paymentMethod?: ExpensePaymentMethod;
  vendor?: string | null;
  reference?: string | null;
  notes?: string | null;
  status?: ExpenseStatus;
}
