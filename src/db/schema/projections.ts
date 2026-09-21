import { pgTable, uuid, text, timestamp, integer, jsonb, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users';

export const playerProjections = pgTable(
  'player_projections',
  {
    userId: uuid('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
    totalXp: integer('total_xp').notNull().default(0),
    totalStars: integer('total_stars').notNull().default(0),
    completedChapters: jsonb('completed_chapters').$type<string[]>().notNull().default([]),
    lastActivityAt: timestamp('last_activity_at', { withTimezone: true }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check('chk_projections_xp_non_negative', sql`${table.totalXp} >= 0`),
    check('chk_projections_stars_non_negative', sql`${table.totalStars} >= 0`),
  ]
);

export const playerStreaks = pgTable(
  'player_streaks',
  {
    userId: uuid('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
    currentStreak: integer('current_streak').notNull().default(0),
    longestStreak: integer('longest_streak').notNull().default(0),
    lastActivityDate: text('last_activity_date'), // YYYY-MM-DD in Asia/Jakarta
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check('chk_streaks_current_non_negative', sql`${table.currentStreak} >= 0`),
    check('chk_streaks_longest_non_negative', sql`${table.longestStreak} >= 0`),
  ]
);
