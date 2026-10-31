import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface DashboardStats {
  date: string;
  students: { active: number };
  teachers: { active: number };
  attendanceToday: {
    present: number;
    absent: number;
    late: number;
    leave: number;
    marked: number;
  };
  fees: {
    openInvoices: number;
    paidInvoices: number;
    outstandingBalance: number;
    collectedThisMonth: number;
  };
  notices: {
    published: number;
    recent: Array<{
      id: string;
      title: string;
      body: string;
      publishedAt: string | null;
      audience: string;
    }>;
  };
}

export function useDashboardStats(enabled = true) {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    enabled,
    queryFn: async () => {
      const response = await api.get<DashboardStats>('/school/dashboard/stats');
      if (!response.data) throw new Error('Dashboard stats unavailable');
      return response.data;
    },
    staleTime: 30_000,
  });
}
