export type AttendanceStatus = 'present' | 'absent' | 'late' | 'leave';

export const attendanceKeys = {
  all: ['attendance'] as const,
  sheet: (sectionId: string, date: string) =>
    [...attendanceKeys.all, 'sheet', sectionId, date] as const,
  summary: (sectionId: string, from: string, to: string) =>
    [...attendanceKeys.all, 'summary', sectionId, from, to] as const,
};
