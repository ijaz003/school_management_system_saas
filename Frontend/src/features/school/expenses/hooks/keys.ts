export type ExpensePaymentMethod =
  | 'cash'
  | 'bank'
  | 'cheque'
  | 'online'
  | 'other';

export type ExpenseStatus = 'recorded' | 'void';

export interface ExpenseFilters {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  paymentMethod?: ExpensePaymentMethod;
  status?: ExpenseStatus;
  fromDate?: string;
  toDate?: string;
}

export interface ExpenseCategoryFilters {
  activeOnly?: boolean;
}

export const expenseKeys = {
  all: ['expenses'] as const,
  lists: () => [...expenseKeys.all, 'list'] as const,
  list: (filters: ExpenseFilters) => [...expenseKeys.lists(), filters] as const,
  details: () => [...expenseKeys.all, 'detail'] as const,
  detail: (id: string) => [...expenseKeys.details(), id] as const,
  categories: () => [...expenseKeys.all, 'categories'] as const,
  categoryList: (filters: ExpenseCategoryFilters = {}) =>
    [...expenseKeys.categories(), filters] as const,
};
