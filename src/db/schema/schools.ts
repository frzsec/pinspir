import { pgTable, uuid, text, timestamp, boolean, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users';

export const schools = pgTable(
  'schools',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    name: text('name').notNull(),
    npsn: text('npsn').unique(),
    city: text('city').notNull().default(''),
    province: text('province').notNull().default(''),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_schools_npsn').on(table.npsn),
  ]
);

export const cohorts = pgTable(
  'cohorts',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    schoolId: uuid('school_id').notNull().references(() => schools.id, { onDelete: 'restrict' }),
    teacherId: uuid('teacher_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
    name: text('name').notNull(),
    cohortCode: text('cohort_code').notNull().unique(), // 6 alphanumeric code, e.g. SMP10A
    academicYear: text('academic_year').notNull().default('2025/2026'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('uq_cohorts_code').on(table.cohortCode),
    index('idx_cohorts_teacher').on(table.teacherId),
    index('idx_cohorts_school').on(table.schoolId),
  ]
);

export const cohortMembers = pgTable(
  'cohort_members',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    cohortId: uuid('cohort_id').notNull().references(() => cohorts.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('uq_cohort_member').on(table.cohortId, table.userId),
    index('idx_cohort_members_user').on(table.userId),
  ]
);
