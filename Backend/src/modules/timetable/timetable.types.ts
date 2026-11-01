export const TIMETABLE_DAYS = [1, 2, 3, 4, 5, 6] as const;
/** Monday = 1 … Saturday = 6 */
export type TimetableDay = (typeof TIMETABLE_DAYS)[number];

export const DEFAULT_TIMETABLE_PERIODS = [
  { name: 'Period 1', sortOrder: 1, startTime: '08:00', endTime: '08:45', isBreak: false },
  { name: 'Period 2', sortOrder: 2, startTime: '08:45', endTime: '09:30', isBreak: false },
  { name: 'Period 3', sortOrder: 3, startTime: '09:30', endTime: '10:15', isBreak: false },
  { name: 'Break', sortOrder: 4, startTime: '10:15', endTime: '10:30', isBreak: true },
  { name: 'Period 4', sortOrder: 5, startTime: '10:30', endTime: '11:15', isBreak: false },
  { name: 'Period 5', sortOrder: 6, startTime: '11:15', endTime: '12:00', isBreak: false },
  { name: 'Lunch', sortOrder: 7, startTime: '12:00', endTime: '12:45', isBreak: true },
  { name: 'Period 6', sortOrder: 8, startTime: '12:45', endTime: '13:30', isBreak: false },
  { name: 'Period 7', sortOrder: 9, startTime: '13:30', endTime: '14:15', isBreak: false },
  { name: 'Period 8', sortOrder: 10, startTime: '14:15', endTime: '15:00', isBreak: false },
] as const;

export interface CreateTimetablePeriodData {
  name: string;
  sortOrder?: number;
  startTime: string;
  endTime: string;
  isBreak?: boolean;
}

export interface UpdateTimetablePeriodData {
  name?: string;
  sortOrder?: number;
  startTime?: string;
  endTime?: string;
  isBreak?: boolean;
}

export interface UpsertTimetableEntryData {
  sectionId: string;
  periodId: string;
  dayOfWeek: TimetableDay;
  subjectId?: string | null;
  teacherId?: string | null;
  room?: string | null;
}

export interface UpdateTimetableEntryData {
  subjectId?: string | null;
  teacherId?: string | null;
  room?: string | null;
}
