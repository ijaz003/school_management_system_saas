import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { parentKeys } from './keys';
import type { ParentRecord } from './useParents';

export interface CreateParentInput {
  fullName: string;
  email: string;
  phone?: string;
  studentIds?: string[];
}

export interface UpdateParentInput {
  fullName?: string;
  phone?: string | null;
  isActive?: boolean;
}

export interface CreateParentResponse {
  parent: ParentRecord;
  tempPassword: string;
}

export interface ParentResetPasswordResponse {
  parentId: string;
  email: string;
  tempPassword: string;
}

function useSyncParent() {
  const queryClient = useQueryClient();
  return (parent: ParentRecord) => {
    queryClient.setQueryData(parentKeys.detail(parent.id), parent);
    void queryClient.invalidateQueries({ queryKey: parentKeys.lists() });
  };
}

export function useCreateParent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateParentInput) => {
      const response = await api.post<CreateParentResponse>('/school/parents', input);
      if (!response.data?.parent || !response.data.tempPassword) {
        throw new Error('The server returned an incomplete response');
      }
      return response.data;
    },
    onSuccess: () => {
      toast.success('Parent account created');
      void queryClient.invalidateQueries({ queryKey: parentKeys.lists() });
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to create parent'),
  });
}

export function useUpdateParent(id: string) {
  const sync = useSyncParent();
  return useMutation({
    mutationFn: async (input: UpdateParentInput) => {
      const response = await api.patch<ParentRecord>(`/school/parents/${id}`, input);
      if (!response.data) throw new Error('The server returned no parent');
      return response.data;
    },
    onSuccess: (parent) => {
      sync(parent);
      toast.success('Parent updated');
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to update parent'),
  });
}

export function useLinkStudents(id: string) {
  const sync = useSyncParent();
  return useMutation({
    mutationFn: async (studentIds: string[]) => {
      const response = await api.post<ParentRecord>(`/school/parents/${id}/students`, {
        studentIds,
      });
      if (!response.data) throw new Error('The server returned no parent');
      return response.data;
    },
    onSuccess: (parent) => {
      sync(parent);
      toast.success('Students linked');
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to link students'),
  });
}

export function useUnlinkStudent(id: string) {
  const sync = useSyncParent();
  return useMutation({
    mutationFn: async (studentId: string) => {
      const response = await api.delete<ParentRecord>(
        `/school/parents/${id}/students/${studentId}`,
      );
      if (!response.data) throw new Error('The server returned no parent');
      return response.data;
    },
    onSuccess: (parent) => {
      sync(parent);
      toast.success('Student unlinked');
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to unlink student'),
  });
}

export function useResetParentPassword() {
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post<ParentResetPasswordResponse>(
        `/school/parents/${id}/reset-password`,
      );
      if (!response.data?.tempPassword) {
        throw new Error('The server returned no temporary password');
      }
      return response.data;
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to reset password'),
  });
}
