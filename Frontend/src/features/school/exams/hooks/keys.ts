export type ExamStatus = 'draft' | 'scheduled' | 'marks_entry' | 'published';

export interface ExamFilters {
  page?: number;
  limit?: number;
  search?: string;
  classId?: string;
  status?: ExamStatus;
}

export const examKeys = {
  all: ['exams'] as const,
  lists: () => [...examKeys.all, 'list'] as const,
  list: (filters: ExamFilters) => [...examKeys.lists(), filters] as const,
  details: () => [...examKeys.all, 'detail'] as const,
  detail: (id: string) => [...examKeys.details(), id] as const,
  marksSheet: (examId: string, examSubjectId: string, sectionId: string) =>
    [...examKeys.all, 'marks', examId, examSubjectId, sectionId] as const,
  results: (id: string) => [...examKeys.all, 'results', id] as const,
};
