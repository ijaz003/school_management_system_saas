export type ChildSection = '' | 'attendance' | 'fees' | 'diary' | 'timetable' | 'results';

export function childPath(studentId: string, section: ChildSection = '') {
  return `/parent/children/${studentId}${section ? `/${section}` : ''}`;
}
