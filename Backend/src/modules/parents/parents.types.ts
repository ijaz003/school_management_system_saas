export interface ListParentsFilters {
  tenantId: string;
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export interface CreateParentData {
  fullName: string;
  email: string;
  phone?: string;
  studentIds?: string[];
}

export interface UpdateParentData {
  fullName?: string;
  phone?: string | null;
  isActive?: boolean;
}

export interface LinkStudentsData {
  studentIds: string[];
}
