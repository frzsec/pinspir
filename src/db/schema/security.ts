import { pgTable, text, integer, timestamp, uuid, index } from 'drizzle-orm/pg-core';
import { users } from './users';

/**
 * rate_limit_entries — PostgreSQL-backed rate limiter (D-09)
 * Replaces the in-memory Map in src/lib/auth/rate-limiter.ts.
 * Each row tracks hit count and reset time for a composite key.
 *
 * Key format: '{action}_{ip}' or '{action}_{ip}_{playerCode}'
 */
export const rateLimitEntries = pgTable(
  'rate_limit_entries',
  {
    key: text('key').primaryKey(),
    count: integer('count').notNull().default(1),
    resetAt: timestamp('reset_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    index('idx_rate_limit_reset').on(table.resetAt),
  ]
);

/**
 * credential_reset_audits — Teacher-Assisted Recovery audit trail (ADR-002)
 * Every teacher-initiated passphrase reset is recorded here permanently.
 *
 * target_user_id: the student whose credentials are being reset
 * reset_by_user_id: the teacher who performed the reset
 * cohort_id: the cohort context authorising this reset (prevents cross-class abuse)
 */
import { cohorts } from './schools';
import { sql } from 'drizzle-orm';

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
