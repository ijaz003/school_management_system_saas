import {
  boolean,
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { tenants } from '../tenants/tenants.schema.js';
import { users } from '../auth/auth.schema.js';
import { classes } from '../classes/classes.schema.js';
import { subjects } from '../subjects/subjects.schema.js';
import { students } from '../students/students.schema.js';

export const exams = pgTable(
  'exams',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 150 }).notNull(),
    classId: uuid('class_id')
      .notNull()
      .references(() => classes.id, { onDelete: 'restrict' }),
    term: varchar('term', { length: 50 }),
    academicYear: varchar('academic_year', { length: 20 }),
    startDate: date('start_date').notNull(),
    endDate: date('end_date').notNull(),
    status: varchar('status', { length: 20 }).default('draft').notNull(),
    publishedAt: timestamp('published_at'),
    createdBy: uuid('created_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    tenantIdx: index('exams_tenant_idx').on(table.tenantId),
    classIdx: index('exams_class_idx').on(table.classId),
    statusIdx: index('exams_status_idx').on(table.tenantId, table.status),
  }),
);

export const examSubjects = pgTable(
  'exam_subjects',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    examId: uuid('exam_id')
      .notNull()
      .references(() => exams.id, { onDelete: 'cascade' }),
    subjectId: uuid('subject_id')
      .notNull()
      .references(() => subjects.id, { onDelete: 'restrict' }),
    maxMarks: integer('max_marks').notNull(),
    passMarks: integer('pass_marks').notNull(),
    examDate: date('exam_date'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    tenantIdx: index('exam_subjects_tenant_idx').on(table.tenantId),
    examIdx: index('exam_subjects_exam_idx').on(table.examId),
    uniqueExamSubject: uniqueIndex('exam_subjects_unique_idx').on(
      table.examId,
      table.subjectId,
    ),
  }),
);

export const examMarks = pgTable(
  'exam_marks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    examSubjectId: uuid('exam_subject_id')
      .notNull()
      .references(() => examSubjects.id, { onDelete: 'cascade' }),
    studentId: uuid('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'cascade' }),
    marksObtained: integer('marks_obtained'),
    isAbsent: boolean('is_absent').default(false).notNull(),
    remarks: text('remarks'),
    enteredBy: uuid('entered_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    tenantIdx: index('exam_marks_tenant_idx').on(table.tenantId),
    examSubjectIdx: index('exam_marks_exam_subject_idx').on(table.examSubjectId),
    uniqueMark: uniqueIndex('exam_marks_unique_idx').on(
      table.examSubjectId,
      table.studentId,
    ),
  }),
);

export type Exam = typeof exams.$inferSelect;
export type NewExam = typeof exams.$inferInsert;
export type ExamSubject = typeof examSubjects.$inferSelect;
export type NewExamSubject = typeof examSubjects.$inferInsert;
export type ExamMark = typeof examMarks.$inferSelect;
export type NewExamMark = typeof examMarks.$inferInsert;
