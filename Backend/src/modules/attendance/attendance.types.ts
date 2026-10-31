export const ATTENDANCE_STATUSES = ['present', 'absent', 'late', 'leave'] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export interface AttendanceMarkItem {
  studentId: string;
  status: AttendanceStatus;
  notes?: string | null;
}

export interface GetSheetInput {
  tenantId: string;
  sectionId: string;
  date: string;
}

export interface SaveSheetInput {
  tenantId: string;
  markedBy: string;
  sectionId: string;
  date: string;
  records: AttendanceMarkItem[];
}

export interface SummaryInput {
  tenantId: string;
  sectionId: string;
  from: string;
  to: string;
}
