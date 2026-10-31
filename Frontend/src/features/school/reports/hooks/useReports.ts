import { useQuery } from '@tanstack/react-query';
import { api, buildQueryString } from '@/lib/api';

export function useFeesReport(
  filters: { from?: string; to?: string; classId?: string; status?: string },
  enabled = true,
) {
  return useQuery({
    queryKey: ['reports', 'fees', filters],
    enabled,
    queryFn: async () => {
      const response = await api.get<{
        filters: { from: string; to: string; classId: string | null; status: string | null };
        summary: {
          invoiceCount: number;
          billed: number;
          collectedOnInvoices: number;
          outstanding: number;
          paymentsInRange: number;
          paymentCount: number;
        };
        byStatus: Array<{ status: string; count: number; amount: number; paid: number }>;
        byClass: Array<{
          classId: string;
          className: string;
          count: number;
          billed: number;
          collected: number;
          outstanding: number;
        }>;
        invoices: Array<{
          id: string;
          title: string;
          studentName: string;
          admissionNo: string;
          className: string | null;
          amount: number;
          amountPaid: number;
          balance: number;
          status: string;
          dueDate: string;
        }>;
      }>(`/school/reports/fees${buildQueryString(filters)}`);
      if (!response.data) throw new Error('Fees report unavailable');
      return response.data;
    },
  });
}

export function useAttendanceReport(
  filters: { from: string; to: string; classId?: string; sectionId?: string },
  enabled = true,
) {
  return useQuery({
    queryKey: ['reports', 'attendance', filters],
    enabled: enabled && Boolean(filters.from && filters.to),
    queryFn: async () => {
      const response = await api.get<{
        filters: {
          from: string;
          to: string;
          classId: string | null;
          sectionId: string | null;
        };
        summary: {
          present: number;
          absent: number;
          late: number;
          leave: number;
          total: number;
          presentRate: number;
        };
        bySection: Array<{
          sectionId: string;
          sectionName: string;
          className: string;
          present: number;
          absent: number;
          late: number;
          leave: number;
          total: number;
        }>;
        byDay: Array<{
          date: string;
          present: number;
          absent: number;
          late: number;
          leave: number;
          total: number;
        }>;
      }>(`/school/reports/attendance${buildQueryString(filters)}`);
      if (!response.data) throw new Error('Attendance report unavailable');
      return response.data;
    },
  });
}

export function useAcademicReport(
  filters: { examId?: string; classId?: string },
  enabled = true,
) {
  return useQuery({
    queryKey: ['reports', 'academic', filters],
    enabled,
    queryFn: async () => {
      const response = await api.get<{
        exam: {
          id: string;
          name: string;
          classId: string;
          className: string;
          status: string;
          term: string | null;
          academicYear: string | null;
          startDate: string;
          endDate: string;
        } | null;
        summary: {
          studentCount: number;
          averagePercentage: number;
          passCount: number;
          failCount: number;
        };
        subjectAverages: Array<{
          examSubjectId: string;
          subjectName: string;
          maxMarks: number;
          passMarks: number;
          average: number;
          markedCount: number;
        }>;
        topStudents: Array<{
          studentId: string;
          fullName: string;
          admissionNo: string;
          sectionName: string;
          totalObtained: number;
          totalMax: number;
          percentage: number;
          passed: boolean;
        }>;
      }>(`/school/reports/academic${buildQueryString(filters)}`);
      if (!response.data) throw new Error('Academic report unavailable');
      return response.data;
    },
  });
}
