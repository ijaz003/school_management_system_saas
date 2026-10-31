import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, buildQueryString } from '@/lib/api';
import { examKeys, type ExamFilters, type ExamStatus } from './keys';

export interface ExamSubject {
  id: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  maxMarks: number;
  passMarks: number;
  examDate: string | null;
}

export interface ExamListItem {
  id: string;
  name: string;
  classId: string;
  className: string;
  term: string | null;
  academicYear: string | null;
  startDate: string;
  endDate: string;
  status: ExamStatus;
  publishedAt: string | null;
  createdAt: string;
  subjectsCount: number;
}

export interface ExamDetail extends Omit<ExamListItem, 'subjectsCount'> {
  createdBy: string | null;
  createdByName: string | null;
  updatedAt: string;
  subjects: ExamSubject[];
}

export interface MarksSheetRecord {
  studentId: string;
  fullName: string;
  admissionNo: string;
  marksObtained: number | null;
  isAbsent: boolean;
  remarks: string | null;
  markId: string | null;
}

export interface MarksSheet {
  exam: { id: string; name: string; status: ExamStatus; classId: string };
  section: { id: string; name: string };
  examSubject: {
    id: string;
    subjectId: string;
    subjectName: string;
    maxMarks: number;
    passMarks: number;
    examDate: string | null;
  };
  records: MarksSheetRecord[];
  readOnly: boolean;
}

export function useExams(filters: ExamFilters = {}) {
  return useQuery({
    queryKey: examKeys.list(filters),
    queryFn: async () => {
      const response = await api.get<{
        items: ExamListItem[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
      }>(`/school/exams${buildQueryString(filters)}`);
      if (!response.data) throw new Error('The server returned no exams');
      return response.data;
    },
  });
}

export function useExam(id: string | undefined) {
  return useQuery({
    queryKey: examKeys.detail(id ?? ''),
    enabled: Boolean(id),
    queryFn: async () => {
      const response = await api.get<ExamDetail>(`/school/exams/${id}`);
      if (!response.data) throw new Error('Exam not found');
      return response.data;
    },
  });
}

export function useCreateExam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      classId: string;
      term?: string;
      academicYear?: string;
      startDate: string;
      endDate: string;
      status?: 'draft' | 'scheduled';
      subjects?: Array<{
        subjectId: string;
        maxMarks: number;
        passMarks: number;
        examDate?: string | null;
      }>;
    }) => {
      const response = await api.post<ExamDetail>('/school/exams', data);
      if (!response.data?.id) throw new Error('Exam was not created');
      return response.data;
    },
    onSuccess: () => {
      toast.success('Exam created');
      void queryClient.invalidateQueries({ queryKey: examKeys.lists() });
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to create exam'),
  });
}

export function useDeleteExam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/school/exams/${id}`);
      return id;
    },
    onSuccess: () => {
      toast.success('Exam deleted');
      void queryClient.invalidateQueries({ queryKey: examKeys.lists() });
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to delete exam'),
  });
}

export function useOpenMarksEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post<ExamDetail>(`/school/exams/${id}/open-marks`);
      if (!response.data) throw new Error('Could not open marks entry');
      return response.data;
    },
    onSuccess: (exam) => {
      toast.success('Marks entry opened');
      void queryClient.invalidateQueries({ queryKey: examKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: examKeys.detail(exam.id) });
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to open marks entry'),
  });
}

export function usePublishExam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post<ExamDetail>(`/school/exams/${id}/publish`);
      if (!response.data) throw new Error('Could not publish results');
      return response.data;
    },
    onSuccess: (exam) => {
      toast.success('Results published');
      void queryClient.invalidateQueries({ queryKey: examKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: examKeys.detail(exam.id) });
      void queryClient.invalidateQueries({ queryKey: examKeys.results(exam.id) });
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to publish results'),
  });
}

export function useMarksSheet(
  examId: string | undefined,
  examSubjectId: string,
  sectionId: string,
) {
  return useQuery({
    queryKey: examKeys.marksSheet(examId ?? '', examSubjectId, sectionId),
    enabled: Boolean(examId && examSubjectId && sectionId),
    queryFn: async () => {
      const response = await api.get<MarksSheet>(
        `/school/exams/${examId}/marks-sheet${buildQueryString({ examSubjectId, sectionId })}`,
      );
      if (!response.data) throw new Error('Marks sheet not found');
      return response.data;
    },
  });
}

export function useSaveMarks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      examId,
      examSubjectId,
      sectionId,
      records,
    }: {
      examId: string;
      examSubjectId: string;
      sectionId: string;
      records: Array<{
        studentId: string;
        marksObtained?: number | null;
        isAbsent?: boolean;
        remarks?: string | null;
      }>;
    }) => {
      const response = await api.put<MarksSheet>(`/school/exams/${examId}/marks`, {
        examSubjectId,
        sectionId,
        records,
      });
      if (!response.data) throw new Error('Marks were not saved');
      return response.data;
    },
    onSuccess: (sheet) => {
      toast.success('Marks saved');
      void queryClient.invalidateQueries({
        queryKey: examKeys.marksSheet(
          sheet.exam.id,
          sheet.examSubject.id,
          sheet.section.id,
        ),
      });
      void queryClient.invalidateQueries({ queryKey: examKeys.detail(sheet.exam.id) });
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to save marks'),
  });
}

export function useExamResults(examId: string | undefined) {
  return useQuery({
    queryKey: examKeys.results(examId ?? ''),
    enabled: Boolean(examId),
    queryFn: async () => {
      const response = await api.get<{
        exam: ExamDetail;
        results: Array<{
          studentId: string;
          fullName: string;
          admissionNo: string;
          sectionName: string;
          totalObtained: number;
          totalMax: number;
          percentage: number;
          absentCount: number;
          subjects: Array<{
            examSubjectId: string;
            subjectName: string;
            maxMarks: number;
            passMarks: number;
            marksObtained: number | null;
            isAbsent: boolean;
            passed: boolean;
          }>;
        }>;
      }>(`/school/exams/${examId}/results`);
      if (!response.data) throw new Error('Results not found');
      return response.data;
    },
  });
}
