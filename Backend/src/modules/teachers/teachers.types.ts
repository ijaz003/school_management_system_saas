export interface ListTeachersFilters {
  tenantId: string;
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export interface CreateAssignmentInput {
  tenantId: string;
  data: {
    teacherId: string;
    sectionId: string;
    subjectId: string;
  };
}

export interface SetClassTeacherInput {
  tenantId: string;
  sectionId: string;
  teacherId: string | null;
}
