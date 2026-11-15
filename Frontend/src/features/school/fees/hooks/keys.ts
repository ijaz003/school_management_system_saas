export type InvoiceStatus = 'draft' | 'issued' | 'partial' | 'paid' | 'cancelled';
export type FeeFrequency = 'monthly' | 'term' | 'annual' | 'one_time';
export type PaymentMethod = 'cash' | 'bank' | 'cheque' | 'online' | 'other';
export type FeeHeadType = FeeFrequency;
export type ScheduleType = 'monthly' | 'specific_months' | 'one_time';

export interface FeeStructureItemInput {
  feeHeadId: string;
  amount: number;
  scheduleType: ScheduleType;
  months?: number[];
  academicYear?: string;
}

export const MONTHS = [
  { value: 1, label: 'Jan', full: 'January' },
  { value: 2, label: 'Feb', full: 'February' },
  { value: 3, label: 'Mar', full: 'March' },
  { value: 4, label: 'Apr', full: 'April' },
  { value: 5, label: 'May', full: 'May' },
  { value: 6, label: 'Jun', full: 'June' },
  { value: 7, label: 'Jul', full: 'July' },
  { value: 8, label: 'Aug', full: 'August' },
  { value: 9, label: 'Sep', full: 'September' },
  { value: 10, label: 'Oct', full: 'October' },
  { value: 11, label: 'Nov', full: 'November' },
  { value: 12, label: 'Dec', full: 'December' },
] as const;

export interface FeeHead {
  id: string;
  name: string;
  code: string;
  type: FeeHeadType;
  description: string | null;
  isActive: boolean;
  isMandatory: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FeeHeadFilters {
  search?: string;
  activeOnly?: boolean;
}

export interface InvoiceFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: InvoiceStatus;
  studentId?: string;
  classId?: string;
  sectionId?: string;
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
  invoicePreview: (structureId: string, periodLabel: string) =>
    [...feeKeys.invoices(), 'preview', structureId, periodLabel] as const,
  heads: () => [...feeKeys.all, 'heads'] as const,
  headList: (filters: FeeHeadFilters = {}) => [...feeKeys.heads(), filters] as const,
};
