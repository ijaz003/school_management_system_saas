import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, buildQueryString } from '@/lib/api';
import { attendanceKeys, type AttendanceStatus } from './keys';

export interface AttendanceSheetRecord {
  studentId: string;
  fullName: string;
  admissionNo: string;
  gender: string;
  status: AttendanceStatus | null;
  notes: string | null;
  recordId: string | null;
}

export interface AttendanceSheet {
  section: {
    id: string;
    name: string;
    fullName: string;
    classId: string;
    className: string;
  };
  date: string;
  isMarked: boolean;
  counts: {
    total: number;
    present: number;
    absent: number;
    late: number;
    leave: number;
    unmarked: number;
  };
  records: AttendanceSheetRecord[];
}

export function useAttendanceSheet(sectionId: string, date: string) {
  return useQuery({
    queryKey: attendanceKeys.sheet(sectionId, date),
    queryFn: async () => {
      const response = await api.get<AttendanceSheet>(
        `/school/attendance/sheet${buildQueryString({ sectionId, date })}`,
      );
      if (!response.data) throw new Error('The server returned no attendance sheet');
      return response.data;
    },
    enabled: Boolean(sectionId && date),
  });
}

export function useSaveAttendanceSheet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      sectionId: string;
      date: string;
      records: Array<{ studentId: string; status: AttendanceStatus; notes?: string | null }>;
    }) => {
      const response = await api.put<AttendanceSheet>('/school/attendance/sheet', payload);
      if (!response.data) throw new Error('Attendance was not saved');
      return response.data;
    },
    onSuccess: (sheet) => {
      toast.success('Attendance saved');
      void queryClient.invalidateQueries({
        queryKey: attendanceKeys.sheet(sheet.section.id, sheet.date),
      });
      void queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to save attendance'),
  });
}
