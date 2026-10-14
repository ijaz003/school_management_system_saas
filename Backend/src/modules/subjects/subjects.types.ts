export interface CreateSubjectInput {
  tenantId: string;
  data: {
    name: string;
    code: string;
    description?: string | null;
    isElective?: boolean;
  };
}

export interface UpdateSubjectInput {
  subjectId: string;
  tenantId: string;
  data: {
    name?: string;
    code?: string;
    description?: string;
    isElective?: boolean;
  };
}
