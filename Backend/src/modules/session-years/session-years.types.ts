export const SESSION_YEAR_STATUSES = ['planned', 'active', 'closed'] as const;
export type SessionYearStatus = (typeof SESSION_YEAR_STATUSES)[number];

export const PLACEMENT_STATUSES = [
  'enrolled',
  'promoted',
  'retained',
  'graduated',
  'transferred',
] as const;
export type PlacementStatus = (typeof PLACEMENT_STATUSES)[number];

export interface CreateSessionYearData {
  name: string;
  startDate: string;
  endDate: string;
  status?: SessionYearStatus;
  setAsCurrent?: boolean;
}

export interface UpdateSessionYearData {
  name?: string;
  startDate?: string;
  endDate?: string;
  status?: SessionYearStatus;
}

export interface PromoteStudentsInput {
  fromSessionYearId: string;
  toSessionYearId: string;
  fromClassId: string;
  toClassId?: string;
  /** Map from source sectionId → target sectionId. Missing keys try same section name. */
  sectionMap?: Record<string, string>;
  /** If omitted, all active students in fromClass are included. */
  studentIds?: string[];
  retainStudentIds?: string[];
  graduateStudentIds?: string[];
}
