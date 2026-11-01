export type TimetableDay = 1 | 2 | 3 | 4 | 5 | 6;

export const timetableKeys = {
  all: ['timetable'] as const,
  periods: () => [...timetableKeys.all, 'periods'] as const,
  grids: () => [...timetableKeys.all, 'grid'] as const,
  grid: (sectionId: string) => [...timetableKeys.grids(), sectionId] as const,
};
