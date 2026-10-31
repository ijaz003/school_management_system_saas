export type InvoiceStatus = 'draft' | 'issued' | 'partial' | 'paid' | 'cancelled';
export type FeeFrequency = 'monthly' | 'term' | 'annual' | 'one_time';
export type PaymentMethod = 'cash' | 'bank' | 'cheque' | 'online' | 'other';

export interface InvoiceFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: InvoiceStatus;
  studentId?: string;
  classId?: string;
}

export interface StructureFilters {
  classId?: string;
  activeOnly?: boolean;
}

export const feeKeys = {
  all: ['fees'] as const,
  structures: () => [...feeKeys.all, 'structures'] as const,
  structureList: (filters: StructureFilters = {}) =>
    [...feeKeys.structures(), filters] as const,
  invoices: () => [...feeKeys.all, 'invoices'] as const,
  invoiceList: (filters: InvoiceFilters) => [...feeKeys.invoices(), 'list', filters] as const,
  invoiceDetail: (id: string) => [...feeKeys.invoices(), 'detail', id] as const,
};
