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

export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(users),
  roles: many(roles),
  classes: many(classes),
  subjects: many(subjects),
  sections: many(sections),
  classSubjects: many(classSubjects),
  sectionSubjects: many(sectionSubjects),
  teacherAssignments: many(teacherAssignments),
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
}));

export const subjectsRelations = relations(subjects, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [subjects.tenantId],
    references: [tenants.id],
  }),
  classSubjects: many(classSubjects),
  sectionSubjects: many(sectionSubjects),
  teacherAssignments: many(teacherAssignments),
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
