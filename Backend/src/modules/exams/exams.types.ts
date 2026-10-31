export const EXAM_STATUSES = ['draft', 'scheduled', 'marks_entry', 'published'] as const;
export type ExamStatus = (typeof EXAM_STATUSES)[number];

export interface ListExamsFilters {
  tenantId: string;
  page?: number;
  limit?: number;
  search?: string;
  classId?: string;
  status?: ExamStatus;
}

export interface ExamSubjectInput {
  subjectId: string;
  maxMarks: number;
  passMarks: number;
  examDate?: string | null;
}

export interface CreateExamInput {
  tenantId: string;
  createdBy: string;
  data: {
    name: string;
    classId: string;
    term?: string;
    academicYear?: string;
    startDate: string;
    endDate: string;
    status?: 'draft' | 'scheduled';
    subjects?: ExamSubjectInput[];
  };
}

export interface UpdateExamInput {
  examId: string;
  tenantId: string;
  data: {
    name?: string;
    term?: string | null;
    academicYear?: string | null;
    startDate?: string;
    endDate?: string;
    status?: 'draft' | 'scheduled' | 'marks_entry';
  };
}

export interface SetExamSubjectsInput {
  examId: string;
  tenantId: string;
  subjects: ExamSubjectInput[];
}

export interface GetMarksSheetInput {
  tenantId: string;
  examId: string;
  examSubjectId: string;
  sectionId: string;
}

export interface SaveMarksInput {
  tenantId: string;
  enteredBy: string;
  examId: string;
  examSubjectId: string;
  sectionId: string;
  records: Array<{
    studentId: string;
    marksObtained?: number | null;
    isAbsent?: boolean;
    remarks?: string | null;
  }>;
}
