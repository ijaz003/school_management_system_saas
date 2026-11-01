import { relations } from 'drizzle-orm';
import { refreshTokens, users } from '../modules/auth/auth.schema.js';
import { roles } from '../modules/roles/roles.schema.js';
import { tenants } from '../modules/tenants/tenants.schema.js';
import { classes } from '../modules/classes/classes.schema.js';
import { subjects } from '../modules/subjects/subjects.schema.js';
import { sections } from '../modules/sections/sections.schema.js';
import { classSubjects } from '../modules/class-subjects/class-subjects.schema.js';
import { sectionSubjects } from '../modules/section-subjects/section-subjects.schema.js';
import { teacherAssignments } from '../modules/teacher-assignments/teacher-assignments.schema.js';
import { students } from '../modules/students/students.schema.js';
import {
  sessionYears,
  studentPlacements,
} from '../modules/session-years/session-years.schema.js';
import { attendanceRecords } from '../modules/attendance/attendance.schema.js';
import { notices } from '../modules/notices/notices.schema.js';
import { diaryEntries } from '../modules/diary/diary.schema.js';
import {
  feeInvoices,
  feePayments,
  feeStructures,
} from '../modules/fees/fees.schema.js';
import { examMarks, exams, examSubjects } from '../modules/exams/exams.schema.js';
import { auditLogs } from '../modules/audit/audit.schema.js';

export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(users),
  roles: many(roles),
  classes: many(classes),
  subjects: many(subjects),
  sections: many(sections),
  classSubjects: many(classSubjects),
  sectionSubjects: many(sectionSubjects),
  teacherAssignments: many(teacherAssignments),
  students: many(students),
  sessionYears: many(sessionYears),
  studentPlacements: many(studentPlacements),
  attendanceRecords: many(attendanceRecords),
  notices: many(notices),
  feeStructures: many(feeStructures),
  feeInvoices: many(feeInvoices),
  feePayments: many(feePayments),
  exams: many(exams),
  examSubjects: many(examSubjects),
  examMarks: many(examMarks),
  auditLogs: many(auditLogs),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [users.tenantId],
    references: [tenants.id],
  }),
  role: one(roles, {
    fields: [users.roleId],
    references: [roles.id],
  }),
  refreshTokens: many(refreshTokens),
  classTeacherSections: many(sections),
  teacherAssignments: many(teacherAssignments),
  notices: many(notices),
  feeInvoicesCreated: many(feeInvoices),
  feePaymentsRecorded: many(feePayments),
  examsCreated: many(exams),
  examMarksEntered: many(examMarks),
}));

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, {
    fields: [refreshTokens.userId],
    references: [users.id],
  }),
}));

export const rolesRelations = relations(roles, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [roles.tenantId],
    references: [tenants.id],
  }),
  users: many(users),
}));

export const classesRelations = relations(classes, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [classes.tenantId],
    references: [tenants.id],
  }),
  sections: many(sections),
  classSubjects: many(classSubjects),
  students: many(students),
  feeStructures: many(feeStructures),
  exams: many(exams),
}));

export const subjectsRelations = relations(subjects, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [subjects.tenantId],
    references: [tenants.id],
  }),
  classSubjects: many(classSubjects),
  sectionSubjects: many(sectionSubjects),
  teacherAssignments: many(teacherAssignments),
  examSubjects: many(examSubjects),
}));

export const sectionsRelations = relations(sections, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [sections.tenantId],
    references: [tenants.id],
  }),
  class: one(classes, {
    fields: [sections.classId],
    references: [classes.id],
  }),
  classTeacher: one(users, {
    fields: [sections.classTeacherId],
    references: [users.id],
  }),
  sectionSubjects: many(sectionSubjects),
  teacherAssignments: many(teacherAssignments),
  students: many(students),
  attendanceRecords: many(attendanceRecords),
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [students.tenantId],
    references: [tenants.id],
  }),
  class: one(classes, {
    fields: [students.classId],
    references: [classes.id],
  }),
  section: one(sections, {
    fields: [students.sectionId],
    references: [sections.id],
  }),
  attendanceRecords: many(attendanceRecords),
  feeInvoices: many(feeInvoices),
  examMarks: many(examMarks),
  placements: many(studentPlacements),
}));

export const sessionYearsRelations = relations(sessionYears, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [sessionYears.tenantId],
    references: [tenants.id],
  }),
  placements: many(studentPlacements),
}));

export const studentPlacementsRelations = relations(studentPlacements, ({ one }) => ({
  tenant: one(tenants, {
    fields: [studentPlacements.tenantId],
    references: [tenants.id],
  }),
  student: one(students, {
    fields: [studentPlacements.studentId],
    references: [students.id],
  }),
  sessionYear: one(sessionYears, {
    fields: [studentPlacements.sessionYearId],
    references: [sessionYears.id],
  }),
  class: one(classes, {
    fields: [studentPlacements.classId],
    references: [classes.id],
  }),
  section: one(sections, {
    fields: [studentPlacements.sectionId],
    references: [sections.id],
  }),
}));

export const examsRelations = relations(exams, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [exams.tenantId],
    references: [tenants.id],
  }),
  class: one(classes, {
    fields: [exams.classId],
    references: [classes.id],
  }),
  createdByUser: one(users, {
    fields: [exams.createdBy],
    references: [users.id],
  }),
  subjects: many(examSubjects),
}));

export const examSubjectsRelations = relations(examSubjects, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [examSubjects.tenantId],
    references: [tenants.id],
  }),
  exam: one(exams, {
    fields: [examSubjects.examId],
    references: [exams.id],
  }),
  subject: one(subjects, {
    fields: [examSubjects.subjectId],
    references: [subjects.id],
  }),
  marks: many(examMarks),
}));

export const examMarksRelations = relations(examMarks, ({ one }) => ({
  tenant: one(tenants, {
    fields: [examMarks.tenantId],
    references: [tenants.id],
  }),
  examSubject: one(examSubjects, {
    fields: [examMarks.examSubjectId],
    references: [examSubjects.id],
  }),
  student: one(students, {
    fields: [examMarks.studentId],
    references: [students.id],
  }),
  enteredByUser: one(users, {
    fields: [examMarks.enteredBy],
    references: [users.id],
  }),
}));

export const attendanceRecordsRelations = relations(attendanceRecords, ({ one }) => ({
  tenant: one(tenants, {
    fields: [attendanceRecords.tenantId],
    references: [tenants.id],
  }),
  section: one(sections, {
    fields: [attendanceRecords.sectionId],
    references: [sections.id],
  }),
  student: one(students, {
    fields: [attendanceRecords.studentId],
    references: [students.id],
  }),
  markedByUser: one(users, {
    fields: [attendanceRecords.markedBy],
    references: [users.id],
  }),
}));

export const noticesRelations = relations(notices, ({ one }) => ({
  tenant: one(tenants, {
    fields: [notices.tenantId],
    references: [tenants.id],
  }),
  author: one(users, {
    fields: [notices.createdBy],
    references: [users.id],
  }),
}));

export const diaryEntriesRelations = relations(diaryEntries, ({ one }) => ({
  tenant: one(tenants, {
    fields: [diaryEntries.tenantId],
    references: [tenants.id],
  }),
  class: one(classes, {
    fields: [diaryEntries.classId],
    references: [classes.id],
  }),
  section: one(sections, {
    fields: [diaryEntries.sectionId],
    references: [sections.id],
  }),
  author: one(users, {
    fields: [diaryEntries.createdBy],
    references: [users.id],
  }),
}));

export const feeStructuresRelations = relations(feeStructures, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [feeStructures.tenantId],
    references: [tenants.id],
  }),
  class: one(classes, {
    fields: [feeStructures.classId],
    references: [classes.id],
  }),
  invoices: many(feeInvoices),
}));

export const feeInvoicesRelations = relations(feeInvoices, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [feeInvoices.tenantId],
    references: [tenants.id],
  }),
  student: one(students, {
    fields: [feeInvoices.studentId],
    references: [students.id],
  }),
  feeStructure: one(feeStructures, {
    fields: [feeInvoices.feeStructureId],
    references: [feeStructures.id],
  }),
  createdByUser: one(users, {
    fields: [feeInvoices.createdBy],
    references: [users.id],
  }),
  payments: many(feePayments),
}));

export const feePaymentsRelations = relations(feePayments, ({ one }) => ({
  tenant: one(tenants, {
    fields: [feePayments.tenantId],
    references: [tenants.id],
  }),
  invoice: one(feeInvoices, {
    fields: [feePayments.invoiceId],
    references: [feeInvoices.id],
  }),
  recordedByUser: one(users, {
    fields: [feePayments.recordedBy],
    references: [users.id],
  }),
}));

export const classSubjectsRelations = relations(
  classSubjects,
  ({ one }) => ({
    tenant: one(tenants, {
      fields: [classSubjects.tenantId],
      references: [tenants.id],
    }),
    class: one(classes, {
      fields: [classSubjects.classId],
      references: [classes.id],
    }),
    subject: one(subjects, {
      fields: [classSubjects.subjectId],
      references: [subjects.id],
    }),
  }),
);

export const sectionSubjectsRelations = relations(
  sectionSubjects,
  ({ one }) => ({
    tenant: one(tenants, {
      fields: [sectionSubjects.tenantId],
      references: [tenants.id],
    }),
    section: one(sections, {
      fields: [sectionSubjects.sectionId],
      references: [sections.id],
    }),
    subject: one(subjects, {
      fields: [sectionSubjects.subjectId],
      references: [subjects.id],
    }),
  }),
);

export const teacherAssignmentsRelations = relations(
  teacherAssignments,
  ({ one }) => ({
    tenant: one(tenants, {
      fields: [teacherAssignments.tenantId],
      references: [tenants.id],
    }),
    teacher: one(users, {
      fields: [teacherAssignments.teacherId],
      references: [users.id],
    }),
    section: one(sections, {
      fields: [teacherAssignments.sectionId],
      references: [sections.id],
    }),
    subject: one(subjects, {
      fields: [teacherAssignments.subjectId],
      references: [subjects.id],
    }),
  }),
);

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  tenant: one(tenants, {
    fields: [auditLogs.tenantId],
    references: [tenants.id],
  }),
  actor: one(users, {
    fields: [auditLogs.actorId],
    references: [users.id],
  }),
}));
