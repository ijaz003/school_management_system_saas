import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMatch } from 'react-router-dom';
import { api, buildQueryString } from '@/lib/api';

export interface ParentChild {
  id: string;
  fullName: string;
  admissionNo: string;
  classId: string;
  sectionId: string;
  className: string;
  sectionName: string;
  status: string;
  linkedAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ParentNotice {
  id: string;
  title: string;
  body: string;
  audience: string;
  publishedAt: string | null;
  createdByName: string | null;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface ChildAttendance {
  student: Pick<ParentChild, 'id' | 'fullName' | 'admissionNo' | 'className' | 'sectionName'>;
  from: string;
  to: string;
  summary: { present: number; absent: number; late: number; excused: number; total: number };
  records: Array<{ id: string; date: string; status: AttendanceStatus; notes: string | null }>;
}

export interface ChildInvoice {
  id: string;
  title: string;
  periodLabel: string | null;
  amount: number;
  amountPaid: number;
  balance: number;
  dueDate: string;
  status: string;
  notes: string | null;
  createdAt: string;
}

export interface ChildDiaryEntry {
  id: string;
  title: string;
  entryDate: string;
  classwork: string | null;
  homework: string | null;
  remarks: string | null;
  publishedAt: string | null;
  className: string | null;
  sectionName: string | null;
}

export interface ChildResultCard {
  exam: {
    id: string;
    name: string;
    term: string | null;
    academicYear: string | null;
    startDate: string | null;
    endDate: string | null;
    publishedAt: string | null;
  };
  card: {
    subjects: Array<{
      examSubjectId: string;
      subjectName: string;
      maxMarks: number;
      passMarks: number;
      marksObtained: number | null;
      isAbsent: boolean;
      passed: boolean;
    }>;
    totals: {
      obtained: number;
      max: number;
      percentage: number;
      absentCount: number;
      result: string;
    };
  };
}

export interface ChildResults {
  student: Pick<ParentChild, 'id' | 'fullName' | 'admissionNo' | 'className' | 'sectionName'>;
  results: ChildResultCard[];
}

export const parentPortalKeys = {
  all: ['parent-portal'] as const,
  home: () => [...parentPortalKeys.all, 'home'] as const,
  notices: (page: number, limit: number) =>
    [...parentPortalKeys.all, 'notices', page, limit] as const,
  attendance: (id: string, from?: string, to?: string) =>
    [...parentPortalKeys.all, 'attendance', id, from ?? '', to ?? ''] as const,
  fees: (id: string, page: number, limit: number) =>
    [...parentPortalKeys.all, 'fees', id, page, limit] as const,
  diary: (id: string, page: number, limit: number) =>
    [...parentPortalKeys.all, 'diary', id, page, limit] as const,
  results: (id: string) => [...parentPortalKeys.all, 'results', id] as const,
};

export function useParentChildren(enabled = true) {
  return useQuery({
    enabled,
    queryKey: parentPortalKeys.home(),
    queryFn: async () => {
      const response = await api.get<{ children: ParentChild[] }>('/parent');
      if (!response.data) throw new Error('The server returned no parent data');
      return response.data.children;
    },
    staleTime: 60_000,
  });
}

export function useParentNotices(page = 1, limit = 20) {
  return useQuery({
    queryKey: parentPortalKeys.notices(page, limit),
    queryFn: async () => {
      const response = await api.get<{ items: ParentNotice[]; pagination: Pagination }>(
        `/parent/notices${buildQueryString({ page, limit })}`,
      );
      if (!response.data) throw new Error('The server returned no notices');
      return response.data;
    },
    staleTime: 30_000,
  });
}

export function useChildAttendance(studentId: string, range: { from?: string; to?: string }) {
  return useQuery({
    queryKey: parentPortalKeys.attendance(studentId, range.from, range.to),
    queryFn: async () => {
      const response = await api.get<ChildAttendance>(
        `/parent/children/${studentId}/attendance${buildQueryString(range)}`,
      );
      if (!response.data) throw new Error('The server returned no attendance');
      return response.data;
    },
    enabled: Boolean(studentId),
  });
}

export function useChildFees(studentId: string, page = 1, limit = 20) {
  return useQuery({
    queryKey: parentPortalKeys.fees(studentId, page, limit),
    queryFn: async () => {
      const response = await api.get<{ items: ChildInvoice[]; pagination: Pagination }>(
        `/parent/children/${studentId}/fees${buildQueryString({ page, limit })}`,
      );
      if (!response.data) throw new Error('The server returned no fees');
      return response.data;
    },
    enabled: Boolean(studentId),
  });
}

export function useChildDiary(studentId: string, page = 1, limit = 20) {
  return useQuery({
    queryKey: parentPortalKeys.diary(studentId, page, limit),
    queryFn: async () => {
      const response = await api.get<{ items: ChildDiaryEntry[]; pagination: Pagination }>(
        `/parent/children/${studentId}/diary${buildQueryString({ page, limit })}`,
      );
      if (!response.data) throw new Error('The server returned no diary');
      return response.data;
    },
    enabled: Boolean(studentId),
  });
}

export function useChildResults(studentId: string) {
  return useQuery({
    queryKey: parentPortalKeys.results(studentId),
    queryFn: async () => {
      const response = await api.get<ChildResults>(`/parent/children/${studentId}/results`);
      if (!response.data) throw new Error('The server returned no results');
      return response.data;
    },
    enabled: Boolean(studentId),
  });
}

const ACTIVE_CHILD_KEY = 'parent.activeChildId';

/**
 * Resolves the child currently in focus: the one in the URL, otherwise the last
 * visited child, otherwise the first linked child.
 */
export function useActiveChildId(enabled = true) {
  const match = useMatch('/parent/children/:studentId/*');
  const urlId = match?.params.studentId;
  const childrenQuery = useParentChildren(enabled);
  const children = enabled ? (childrenQuery.data ?? []) : [];

  useEffect(() => {
    if (urlId) localStorage.setItem(ACTIVE_CHILD_KEY, urlId);
  }, [urlId]);

  if (!enabled) return undefined;
  if (urlId) return urlId;
  const remembered = localStorage.getItem(ACTIVE_CHILD_KEY);
  if (remembered && children.some((child) => child.id === remembered)) return remembered;
  return children[0]?.id;
}
