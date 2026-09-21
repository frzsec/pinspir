import { pgTable, uuid, text, timestamp, boolean, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users';
import { cohorts } from './schools';

export const userConsents = pgTable(
  'user_consents',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    consentType: text('consent_type').notNull(), // 'terms_of_service', 'analytics_minimal', 'leaderboard_opt_in'
    granted: boolean('granted').notNull().default(false),
    grantedAt: timestamp('granted_at', { withTimezone: true }).notNull().defaultNow(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_user_consents_user').on(table.userId),
  ]
);

export const credentialResetAudits = pgTable(
  'credential_reset_audits',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    targetUserId: uuid('target_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    teacherId: uuid('teacher_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
    cohortId: uuid('cohort_id').notNull().references(() => cohorts.id, { onDelete: 'cascade' }),
    reason: text('reason').notNull().default('Reset sandi murid terbimbing di kelas'),
    resetAt: timestamp('reset_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_reset_audits_target').on(table.targetUserId),
    index('idx_reset_audits_teacher').on(table.teacherId),
  ]
);
