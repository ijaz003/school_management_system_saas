export type ChildSection = '' | 'attendance' | 'fees' | 'diary' | 'results';

export function childPath(studentId: string, section: ChildSection = '') {
  return `/parent/children/${studentId}${section ? `/${section}` : ''}`;
}
