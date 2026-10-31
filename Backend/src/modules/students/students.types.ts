export const STUDENT_STATUSES = ['active', 'inactive', 'transferred', 'alumni'] as const;
export type StudentStatus = (typeof STUDENT_STATUSES)[number];

export const STUDENT_GENDERS = ['male', 'female', 'other'] as const;
export type StudentGender = (typeof STUDENT_GENDERS)[number];

export interface StudentListItem {
  id: string;
  admissionNo: string;
  fullName: string;
  gender: string;
  dateOfBirth: string;
  phone: string | null;
  email: string | null;
  classId: string;
  sectionId: string;
  className: string;
  sectionName: string;
  guardianName: string;
  guardianPhone: string;
  status: string;
  admissionDate: string;
  createdAt: Date;
}

export interface StudentDetail extends StudentListItem {
  bloodGroup: string | null;
  address: string | null;
  guardianEmail: string | null;
  guardianRelation: string | null;
  notes: string | null;
  updatedAt: Date;
}

export interface CreateStudentData {
  admissionNo?: string;
  fullName: string;
  gender: StudentGender;
  dateOfBirth: string;
  bloodGroup?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  classId: string;
  sectionId: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail?: string | null;
  guardianRelation?: string | null;
  status?: StudentStatus;
  admissionDate?: string;
  notes?: string | null;
}

export interface UpdateStudentData {
  admissionNo?: string;
  fullName?: string;
  gender?: StudentGender;
  dateOfBirth?: string;
  bloodGroup?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  classId?: string;
  sectionId?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianEmail?: string | null;
  guardianRelation?: string | null;
  status?: StudentStatus;
  admissionDate?: string;
  notes?: string | null;
}

export interface ListStudentsFilters {
  tenantId: string;
  page?: number;
  limit?: number;
  search?: string;
  classId?: string;
  sectionId?: string;
  status?: StudentStatus;
}

export interface CreateStudentInput {
  tenantId: string;
  data: CreateStudentData;
}

export interface UpdateStudentInput {
  studentId: string;
  tenantId: string;
  data: UpdateStudentData;
}
