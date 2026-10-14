import {
  index,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { tenants } from '../tenants/tenants.schema.js';
import { sections } from '../sections/sections.schema.js';
import { subjects } from '../subjects/subjects.schema.js';

export const sectionSubjects = pgTable(
  'section_subjects',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    sectionId: uuid('section_id')
      .notNull()
      .references(() => sections.id, { onDelete: 'cascade' }),
    subjectId: uuid('subject_id')
      .notNull()
      .references(() => subjects.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    tenantIdx: index('section_subjects_tenant_idx').on(table.tenantId),
    sectionSubjectIdx: uniqueIndex('section_subjects_unique_idx').on(
      table.sectionId,
      table.subjectId,
    ),
  }),
);

export type SectionSubject = typeof sectionSubjects.$inferSelect;
export type NewSectionSubject = typeof sectionSubjects.$inferInsert;
