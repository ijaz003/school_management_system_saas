import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, buildQueryString } from '@/lib/api';
import {
  expenseKeys,
  type ExpenseCategoryFilters,
  type ExpenseFilters,
  type ExpensePaymentMethod,
  type ExpenseStatus,
} from './keys';

export interface ExpenseCategory {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  expenseDate: string;
  paymentMethod: ExpensePaymentMethod | string;
  vendor: string | null;
  reference: string | null;
  notes: string | null;
  status: ExpenseStatus | string;
  categoryId: string | null;
  categoryName: string | null;
  createdBy: string | null;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseSummary {
  totalAmount: number;
  recordedCount: number;
  voidCount: number;
}

export function useExpenseCategories(
  filters: ExpenseCategoryFilters = {},
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: expenseKeys.categoryList(filters),
    queryFn: async () => {
      const response = await api.get<ExpenseCategory[]>(
        `/school/expenses/categories${buildQueryString(filters)}`,
      );
      if (!response.data) throw new Error('The server returned no categories');
      return response.data;
    },
    enabled: options.enabled ?? true,
  });
}

export function useExpenses(
  filters: ExpenseFilters = {},
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: expenseKeys.list(filters),
    queryFn: async () => {
      const response = await api.get<{
        items: Expense[];
        summary: ExpenseSummary;
        pagination: { page: number; limit: number; total: number; totalPages: number };
      }>(`/school/expenses${buildQueryString(filters)}`);
      if (!response.data) throw new Error('The server returned no expenses');
      return response.data;
    },
    enabled: options.enabled ?? true,
  });
}

export function useCreateExpenseCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; description?: string | null }) => {
      const response = await api.post<ExpenseCategory>('/school/expenses/categories', data);
      if (!response.data?.id) throw new Error('Category was not created');
      return response.data;
    },
    onSuccess: () => {
      toast.success('Category created');
      void queryClient.invalidateQueries({ queryKey: expenseKeys.categories() });
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to create category'),
  });
}

export function useUpdateExpenseCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      name?: string;
      description?: string | null;
      isActive?: boolean;
    }) => {
      const { id, ...data } = input;
      const response = await api.patch<ExpenseCategory>(
        `/school/expenses/categories/${id}`,
        data,
      );
      if (!response.data) throw new Error('Category was not updated');
      return response.data;
    },
    onSuccess: () => {
      toast.success('Category updated');
      void queryClient.invalidateQueries({ queryKey: expenseKeys.categories() });
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to update category'),
  });
}

export function useDeleteExpenseCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/school/expenses/categories/${id}`);
      return id;
    },
    onSuccess: () => {
      toast.success('Category deleted');
      void queryClient.invalidateQueries({ queryKey: expenseKeys.categories() });
      void queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to delete category'),
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      title: string;
      amount: number;
      expenseDate: string;
      categoryId?: string | null;
      paymentMethod?: ExpensePaymentMethod;
      vendor?: string | null;
      reference?: string | null;
      notes?: string | null;
    }) => {
      const response = await api.post<Expense>('/school/expenses', data);
      if (!response.data?.id) throw new Error('Expense was not created');
      return response.data;
    },
    onSuccess: () => {
      toast.success('Expense recorded');
      void queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to record expense'),
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      title?: string;
      amount?: number;
      expenseDate?: string;
      categoryId?: string | null;
      paymentMethod?: ExpensePaymentMethod;
      vendor?: string | null;
      reference?: string | null;
      notes?: string | null;
      status?: ExpenseStatus;
    }) => {
      const { id, ...data } = input;
      const response = await api.patch<Expense>(`/school/expenses/${id}`, data);
      if (!response.data) throw new Error('Expense was not updated');
      return response.data;
    },
    onSuccess: () => {
      toast.success('Expense updated');
      void queryClient.invalidateQueries({ queryKey: expenseKeys.all });
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to update expense'),
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/school/expenses/${id}`);
      return id;
    },
    onSuccess: () => {
      toast.success('Expense deleted');
      void queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to delete expense'),
  });
}
