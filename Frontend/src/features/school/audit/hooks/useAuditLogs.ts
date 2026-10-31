import { useQuery } from '@tanstack/react-query';
import { api, buildQueryString } from '@/lib/api';

export interface AuditLogItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  summary: string;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
  actorId: string | null;
  actorName: string | null;
  actorEmail: string | null;
}

export interface AuditFilters {
  page?: number;
  limit?: number;
  action?: string;
  entityType?: string;
  from?: string;
  to?: string;
}

export function useAuditLogs(filters: AuditFilters = {}, enabled = true) {
  return useQuery({
    queryKey: ['audit-logs', filters],
    enabled,
    queryFn: async () => {
      const response = await api.get<{
        items: AuditLogItem[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
      }>(`/school/audit-logs${buildQueryString(filters)}`);
      if (!response.data) throw new Error('Audit logs unavailable');
      return response.data;
    },
  });
}
