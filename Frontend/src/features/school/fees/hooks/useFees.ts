import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, buildQueryString } from '@/lib/api';
import {
  feeKeys,
  type FeeHead,
  type FeeHeadFilters,
  type FeeHeadType,
  type FeeFrequency,
  type InvoiceFilters,
  type InvoiceStatus,
  type PaymentMethod,
  type StructureFilters,
} from './keys';

export interface FeeStructure {
  id: string;
  name: string;
  classId: string | null;
  className: string | null;
  sectionId: string | null;
  sectionName: string | null;
  amount: number;
  frequency: FeeFrequency;
  description: string | null;
  items: FeeStructureItem[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FeeStructureItem {
  id: string;
  feeHeadId: string;
  feeHeadName: string;
  feeHeadCode: string;
  amount: number;
}

export interface FeePayment {
  id: string;
  amount: number;
  method: PaymentMethod;
  paidAt: string;
  reference: string | null;
  notes: string | null;
  recordedBy: string | null;
  recordedByName: string | null;
  createdAt: string;
}

export interface FeeInvoiceItem {
  id: string;
  feeHeadId: string | null;
  name: string;
  amount: number;
}

export interface FeeInvoice {
  id: string;
  studentId: string;
  studentName: string | null;
  admissionNo: string | null;
  className: string | null;
  sectionName: string | null;
  feeStructureId: string | null;
  title: string;
  periodLabel: string | null;
  amount: number;
  amountPaid: number;
  balance: number;
  dueDate: string;
  status: InvoiceStatus;
  notes: string | null;
  createdBy: string | null;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
  items?: FeeInvoiceItem[];
  payments?: FeePayment[];
}

export function useFeeHeads(filters: FeeHeadFilters = {}) {
  return useQuery({
    queryKey: feeKeys.headList(filters),
    queryFn: async () => {
      const response = await api.get<FeeHead[]>(
        `/school/fees/heads${buildQueryString({
          search: filters.search,
          activeOnly:
            filters.activeOnly === undefined ? undefined : String(filters.activeOnly),
        })}`,
      );
      if (!response.data) throw new Error('The server returned no fee heads');
      return response.data;
    },
  });
}

export function useCreateFeeHead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      code: string;
      type?: FeeHeadType;
      description?: string;
      isMandatory?: boolean;
    }) => {
      const response = await api.post<FeeHead>('/school/fees/heads', data);
      if (!response.data?.id) throw new Error('Fee head was not created');
      return response.data;
    },
    onSuccess: () => {
      toast.success('Fee head created');
      void queryClient.invalidateQueries({ queryKey: feeKeys.heads() });
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to create fee head'),
  });
}

export function useUpdateFeeHead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: string;
      name?: string;
      code?: string;
      type?: FeeHeadType;
      description?: string | null;
      isMandatory?: boolean;
      isActive?: boolean;
    }) => {
      const response = await api.patch<FeeHead>(`/school/fees/heads/${id}`, data);
      if (!response.data) throw new Error('Fee head was not updated');
      return response.data;
    },
    onSuccess: () => {
      toast.success('Fee head updated');
      void queryClient.invalidateQueries({ queryKey: feeKeys.heads() });
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to update fee head'),
  });
}

export function useDeleteFeeHead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/school/fees/heads/${id}`);
      return id;
    },
    onSuccess: () => {
      toast.success('Fee head deleted');
      void queryClient.invalidateQueries({ queryKey: feeKeys.heads() });
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to delete fee head'),
  });
}

export function useFeeStructures(filters: StructureFilters = {}) {
  return useQuery({
    queryKey: feeKeys.structureList(filters),
    queryFn: async () => {
      const response = await api.get<FeeStructure[]>(
        `/school/fees/structures${buildQueryString({
          classId: filters.classId,
          activeOnly: filters.activeOnly === undefined ? undefined : String(filters.activeOnly),
        })}`,
      );
      if (!response.data) throw new Error('The server returned no fee structures');
      return response.data;
    },
  });
}

export function useCreateFeeStructure() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      classId?: string | null;
      sectionId?: string | null;
      frequency?: FeeFrequency;
      description?: string | null;
      items: Array<{ feeHeadId: string; amount: number }>;
    }) => {
      const response = await api.post<FeeStructure>('/school/fees/structures', data);
      if (!response.data?.id) throw new Error('Fee structure was not created');
      return response.data;
    },
    onSuccess: () => {
      toast.success('Fee structure created');
      void queryClient.invalidateQueries({ queryKey: feeKeys.structures() });
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to create structure'),
  });
}

export function useUpdateFeeStructure() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: string;
      name?: string;
      classId?: string | null;
      sectionId?: string | null;
      frequency?: FeeFrequency;
      description?: string | null;
      isActive?: boolean;
      items?: Array<{ feeHeadId: string; amount: number }>;
    }) => {
      const response = await api.patch<FeeStructure>(`/school/fees/structures/${id}`, data);
      if (!response.data) throw new Error('Fee structure was not updated');
      return response.data;
    },
    onSuccess: () => {
      toast.success('Fee structure updated');
      void queryClient.invalidateQueries({ queryKey: feeKeys.structures() });
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to update structure'),
  });
}

export function useDeleteFeeStructure() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/school/fees/structures/${id}`);
      return id;
    },
    onSuccess: () => {
      toast.success('Fee structure deleted');
      void queryClient.invalidateQueries({ queryKey: feeKeys.structures() });
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to delete structure'),
  });
}

export function useInvoices(
  filters: InvoiceFilters = {},
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: feeKeys.invoiceList(filters),
    queryFn: async () => {
      const response = await api.get<{
        items: FeeInvoice[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
      }>(`/school/fees/invoices${buildQueryString(filters)}`);
      if (!response.data) throw new Error('The server returned no invoices');
      return response.data;
    },
    enabled: options.enabled ?? true,
  });
}

export function useInvoice(id: string | null) {
  return useQuery({
    queryKey: feeKeys.invoiceDetail(id ?? ''),
    enabled: Boolean(id),
    queryFn: async () => {
      const response = await api.get<FeeInvoice>(`/school/fees/invoices/${id}`);
      if (!response.data) throw new Error('Invoice not found');
      return response.data;
    },
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      studentId: string;
      feeStructureId?: string;
      title?: string;
      periodLabel?: string;
      amount?: number;
      dueDate: string;
      notes?: string;
      issue?: boolean;
    }) => {
      const response = await api.post<FeeInvoice>('/school/fees/invoices', data);
      if (!response.data?.id) throw new Error('Invoice was not created');
      return response.data;
    },
    onSuccess: () => {
      toast.success('Invoice created');
      void queryClient.invalidateQueries({ queryKey: feeKeys.invoices() });
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to create invoice'),
  });
}

export function useGenerateInvoices() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      feeStructureId: string;
      periodLabel: string;
      dueDate: string;
      classId?: string;
      sectionId?: string;
      notes?: string;
    }) => {
      const response = await api.post<{
        createdCount: number;
        skippedCount: number;
        invoiceIds: string[];
      }>(
        '/school/fees/invoices/generate',
        data,
      );
      if (!response.data) throw new Error('Invoices were not generated');
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(
        `${data.createdCount} invoice(s) generated${data.skippedCount ? `; ${data.skippedCount} already existed` : ''}`,
      );
      void queryClient.invalidateQueries({ queryKey: feeKeys.invoices() });
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to generate invoices'),
  });
}

export function useRecordPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      invoiceId,
      ...data
    }: {
      invoiceId: string;
      amount: number;
      method?: PaymentMethod;
      reference?: string;
      notes?: string;
    }) => {
      const response = await api.post<FeeInvoice>(
        `/school/fees/invoices/${invoiceId}/payments`,
        data,
      );
      if (!response.data) throw new Error('Payment was not recorded');
      return response.data;
    },
    onSuccess: (invoice) => {
      toast.success('Payment recorded');
      void queryClient.invalidateQueries({ queryKey: feeKeys.invoices() });
      void queryClient.invalidateQueries({ queryKey: feeKeys.invoiceDetail(invoice.id) });
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to record payment'),
  });
}

export function useVoidPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (paymentId: string) => {
      const response = await api.delete<FeeInvoice>(`/school/fees/payments/${paymentId}`);
      if (!response.data) throw new Error('Payment was not voided');
      return response.data;
    },
    onSuccess: (invoice) => {
      toast.success('Payment voided');
      void queryClient.invalidateQueries({ queryKey: feeKeys.invoices() });
      void queryClient.invalidateQueries({ queryKey: feeKeys.invoiceDetail(invoice.id) });
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to void payment'),
  });
}
