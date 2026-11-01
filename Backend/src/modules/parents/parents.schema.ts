import { sql } from 'drizzle-orm';
import {
  index,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { tenants } from '../tenants/tenants.schema.js';
import { users } from '../auth/auth.schema.js';
import { students } from '../students/students.schema.js';

export const parentStudents = pgTable(
  'parent_students',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    parentUserId: uuid('parent_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    studentId: uuid('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    tenantIdx: index('parent_students_tenant_idx').on(table.tenantId),
    parentIdx: index('parent_students_parent_idx').on(table.parentUserId),
    studentIdx: index('parent_students_student_idx').on(table.studentId),
    linkIdx: uniqueIndex('parent_students_unique_idx')
      .on(table.parentUserId, table.studentId)
      .where(sql`deleted_at IS NULL`),
  }),
);

export type ParentStudent = typeof parentStudents.$inferSelect;
export type NewParentStudent = typeof parentStudents.$inferInsert;
