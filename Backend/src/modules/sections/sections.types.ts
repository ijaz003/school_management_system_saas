export interface CreateSectionInput {
  tenantId: string;
  data: {
    classId: string;
    name: string;
    useClassSubjects: boolean;
    stream?: string;
    capacity?: number;
    classTeacherId?: string | null;
    subjectIds?: string[];
  };
}

export interface UpdateSectionInput {
  sectionId: string;
  tenantId: string;
  data: {
    name?: string;
    stream?: string | null;
    capacity?: number;
    classTeacherId?: string | null;
    useClassSubjects?: boolean;
    subjectIds?: string[];
  };
}
