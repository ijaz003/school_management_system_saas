export const FEE_FREQUENCIES = ['monthly', 'term', 'annual', 'one_time'] as const;
export type FeeFrequency = (typeof FEE_FREQUENCIES)[number];

export const INVOICE_STATUSES = [
  'draft',
  'issued',
  'partial',
  'paid',
  'cancelled',
] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const PAYMENT_METHODS = ['cash', 'bank', 'cheque', 'online', 'other'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export interface ListFeeStructuresFilters {
  tenantId: string;
  classId?: string;
  activeOnly?: boolean;
}

export interface CreateFeeStructureInput {
  tenantId: string;
  data: {
    name: string;
    classId?: string | null;
    amount: number;
    frequency?: FeeFrequency;
    description?: string | null;
  };
}

export interface UpdateFeeStructureInput {
  structureId: string;
  tenantId: string;
  data: {
    name?: string;
    classId?: string | null;
    amount?: number;
    frequency?: FeeFrequency;
    description?: string | null;
    isActive?: boolean;
  };
}

export interface ListInvoicesFilters {
  tenantId: string;
  page?: number;
  limit?: number;
  search?: string;
  status?: InvoiceStatus;
  studentId?: string;
  classId?: string;
}

export interface CreateInvoiceInput {
  tenantId: string;
  createdBy: string;
  data: {
    studentId: string;
    feeStructureId?: string;
    title?: string;
    periodLabel?: string;
    amount?: number;
    dueDate: string;
    notes?: string;
    issue?: boolean;
  };
}

export interface GenerateInvoicesInput {
  tenantId: string;
  createdBy: string;
  data: {
    feeStructureId: string;
    periodLabel: string;
    dueDate: string;
    classId?: string;
    sectionId?: string;
    notes?: string;
  };
}

export interface RecordPaymentInput {
  tenantId: string;
  recordedBy: string;
  invoiceId: string;
  data: {
    amount: number;
    method?: PaymentMethod;
    paidAt?: string;
    reference?: string;
    notes?: string;
  };
}
