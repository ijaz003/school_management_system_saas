import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, buildQueryString } from '@/lib/api';

export type SessionYearStatus = 'planned' | 'active' | 'closed';

export interface SessionYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: SessionYearStatus;
  isCurrent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PromotionPreview {
  fromClass: { id: string; name: string; order: number };
  nextClass: { id: string; name: string; order: number } | null;
  fromSections: Array<{ id: string; name: string }>;
  toSections: Array<{ id: string; name: string }>;
  students: Array<{
    id: string;
    fullName: string;
    admissionNo: string;
    sectionId: string;
    sectionName: string;
  }>;
}

export interface PromoteResult {
  fromSessionYear: { id: string; name: string };
  toSessionYear: { id: string; name: string };
  counts: {
    promoted: number;
    retained: number;
    graduated: number;
    failed: number;
  };
  promoted: Array<{ studentId: string; admissionNo: string; fullName: string }>;
  retained: Array<{ studentId: string; admissionNo: string; fullName: string }>;
  graduated: Array<{ studentId: string; admissionNo: string; fullName: string }>;
  errors: Array<{ studentId: string; admissionNo: string; message: string }>;
}

export interface SessionYearPlacement {
  id: string;
  studentId: string;
  studentName: string;
  admissionNo: string;
  sessionYearId: string;
  sessionYearName: string;
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
  status: string;
  isCurrent: boolean;
  createdAt: string;
}

const keys = {
  all: ['session-years'] as const,
  list: () => [...keys.all, 'list'] as const,
  current: () => [...keys.all, 'current'] as const,
  detail: (id: string) => [...keys.all, 'detail', id] as const,
  placements: (sessionYearId: string) => [...keys.all, 'placements', sessionYearId] as const,
  preview: (fromSessionYearId: string, fromClassId: string, toClassId?: string) =>
    [...keys.all, 'preview', fromSessionYearId, fromClassId, toClassId ?? ''] as const,
};

export function useSessionYears(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: keys.list(),
    enabled: options.enabled ?? true,
    queryFn: async () => {
      const response = await api.get<SessionYear[]>('/school/session-years');
      if (!response.data) throw new Error('No session years returned');
      return response.data;
    },
  });
}

export function useCurrentSessionYear(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: keys.current(),
    enabled: options.enabled ?? true,
    queryFn: async () => {
      const response = await api.get<SessionYear | null>('/school/session-years/current');
      return response.data ?? null;
    },
  });
}

export function useSessionYear(id: string | undefined) {
  return useQuery({
    queryKey: keys.detail(id ?? ''),
    enabled: Boolean(id),
    queryFn: async () => {
      const response = await api.get<SessionYear>(`/school/session-years/${id}`);
      if (!response.data) throw new Error('Session year not found');
      return response.data;
    },
  });
}

export function useSessionYearPlacements(sessionYearId: string | undefined) {
  return useQuery({
    queryKey: keys.placements(sessionYearId ?? ''),
    enabled: Boolean(sessionYearId),
    queryFn: async () => {
      const response = await api.get<SessionYearPlacement[]>(
        `/school/session-years/placements${buildQueryString({ sessionYearId })}`,
      );
      return response.data ?? [];
    },
  });
}

export function useCreateSessionYear() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      startDate: string;
      endDate: string;
      status?: SessionYearStatus;
      setAsCurrent?: boolean;
    }) => {
      const response = await api.post<SessionYear>('/school/session-years', data);
      if (!response.data) throw new Error('Session year was not created');
      return response.data;
    },
    onSuccess: () => {
      toast.success('Session year created');
      void queryClient.invalidateQueries({ queryKey: keys.all });
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to create session year'),
  });
}

export function useUpdateSessionYear() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      data: {
        name?: string;
        startDate?: string;
        endDate?: string;
        status?: SessionYearStatus;
      };
    }) => {
      const response = await api.patch<SessionYear>(
        `/school/session-years/${input.id}`,
        input.data,
      );
      if (!response.data) throw new Error('Session year was not updated');
      return response.data;
    },
    onSuccess: () => {
      toast.success('Session year updated');
      void queryClient.invalidateQueries({ queryKey: keys.all });
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to update session year'),
  });
}

export function useSetCurrentSessionYear() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post<SessionYear>(`/school/session-years/${id}/set-current`);
      if (!response.data) throw new Error('Could not set current session year');
      return response.data;
    },
    onSuccess: () => {
      toast.success('Current session year updated');
      void queryClient.invalidateQueries({ queryKey: keys.all });
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to set current year'),
  });
}

export function useDeleteSessionYear() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/school/session-years/${id}`);
      return id;
    },
    onSuccess: () => {
      toast.success('Session year deleted');
      void queryClient.invalidateQueries({ queryKey: keys.all });
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to delete session year'),
  });
}

export function usePromotionPreview(
  fromSessionYearId: string,
  fromClassId: string,
  toClassId?: string,
) {
  return useQuery({
    queryKey: keys.preview(fromSessionYearId, fromClassId, toClassId),
    enabled: Boolean(fromSessionYearId && fromClassId),
    queryFn: async () => {
      const response = await api.get<PromotionPreview>(
        `/school/session-years/promotions/preview${buildQueryString({
          fromSessionYearId,
          fromClassId,
          toClassId: toClassId || undefined,
        })}`,
      );
      if (!response.data) throw new Error('Preview unavailable');
      return response.data;
    },
  });
}

export function usePromoteStudents() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      fromSessionYearId: string;
      toSessionYearId: string;
      fromClassId: string;
      toClassId?: string;
      sectionMap?: Record<string, string>;
      studentIds?: string[];
      retainStudentIds?: string[];
      graduateStudentIds?: string[];
    }) => {
      const response = await api.post<PromoteResult>('/school/session-years/promotions', data);
      if (!response.data) throw new Error('Promotion failed');
      return response.data;
    },
    onSuccess: (result) => {
      toast.success(
        `Promoted ${result.counts.promoted}, retained ${result.counts.retained}, graduated ${result.counts.graduated}`,
      );
      void queryClient.invalidateQueries({ queryKey: keys.all });
      void queryClient.invalidateQueries({ queryKey: ['students'] });
    },
    onError: (error: Error) => toast.error(error.message || 'Promotion failed'),
  });
}
