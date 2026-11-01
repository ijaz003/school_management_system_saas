import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, buildQueryString } from '@/lib/api';
import {
  supportKeys,
  type SupportCategory,
  type SupportPriority,
  type SupportStatus,
  type SupportTicketFilters,
} from './keys';

export interface SupportTicket {
  id: string;
  tenantId: string;
  tenantName: string | null;
  tenantSlug: string | null;
  subject: string;
  category: SupportCategory | string;
  priority: SupportPriority | string;
  status: SupportStatus | string;
  createdBy: string | null;
  createdByName: string | null;
  assignedTo: string | null;
  assignedToName: string | null;
  lastMessageAt: string;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SupportMessage {
  id: string;
  body: string;
  isInternal: boolean;
  authorId: string | null;
  authorName: string | null;
  authorRole: string | null;
  createdAt: string;
}

export interface SupportTicketDetail {
  ticket: SupportTicket;
  messages: SupportMessage[];
}

type Scope = 'school' | 'platform';

function basePath(scope: Scope) {
  return scope === 'school' ? '/school/support' : '/super-admin/support';
}

export function useSupportTickets(
  scope: Scope,
  filters: SupportTicketFilters = {},
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: supportKeys.list(scope, filters),
    queryFn: async () => {
      const response = await api.get<{
        items: SupportTicket[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
      }>(`${basePath(scope)}${buildQueryString(filters)}`);
      if (!response.data) throw new Error('The server returned no support tickets');
      return response.data;
    },
    enabled: options.enabled ?? true,
  });
}

export function useSupportTicket(
  scope: Scope,
  id: string | undefined,
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: supportKeys.detail(scope, id ?? ''),
    queryFn: async () => {
      if (!id) throw new Error('Ticket id is required');
      const response = await api.get<SupportTicketDetail>(`${basePath(scope)}/${id}`);
      if (!response.data) throw new Error('The server returned no ticket');
      return response.data;
    },
    enabled: (options.enabled ?? true) && Boolean(id),
  });
}

export function useCreateSupportTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      subject: string;
      body: string;
      category?: SupportCategory;
      priority?: SupportPriority;
    }) => {
      const response = await api.post<SupportTicketDetail>('/school/support', data);
      if (!response.data?.ticket?.id) throw new Error('Ticket was not created');
      return response.data;
    },
    onSuccess: () => {
      toast.success('Support ticket created');
      void queryClient.invalidateQueries({ queryKey: supportKeys.lists() });
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to create ticket'),
  });
}

export function useUpdateSupportTicket(scope: Scope) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      status?: SupportStatus;
      priority?: SupportPriority;
      category?: SupportCategory;
      assignedTo?: string | null;
    }) => {
      const { id, ...data } = input;
      const response = await api.patch<SupportTicketDetail>(`${basePath(scope)}/${id}`, data);
      if (!response.data) throw new Error('Ticket was not updated');
      return response.data;
    },
    onSuccess: (detail) => {
      toast.success('Ticket updated');
      void queryClient.invalidateQueries({ queryKey: supportKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: supportKeys.detail(scope, detail.ticket.id),
      });
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to update ticket'),
  });
}

export function useAddSupportMessage(scope: Scope) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; body: string; isInternal?: boolean }) => {
      const { id, ...data } = input;
      const response = await api.post<SupportTicketDetail>(
        `${basePath(scope)}/${id}/messages`,
        data,
      );
      if (!response.data) throw new Error('Message was not added');
      return response.data;
    },
    onSuccess: (detail) => {
      toast.success('Message sent');
      void queryClient.invalidateQueries({ queryKey: supportKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: supportKeys.detail(scope, detail.ticket.id),
      });
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to send message'),
  });
}
