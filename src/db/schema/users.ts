import { pgTable, uuid, text, timestamp, boolean, jsonb, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    role: text('role').notNull().default('student'), // 'student', 'teacher', 'admin'
    playerCode: text('player_code'), // 'FOX-XXXX-YYY' for student, unique if present
    nickname: text('nickname').notNull().default('Petualang'),
    avatarConfig: jsonb('avatar_config').$type<Record<string, unknown>>().notNull().default({}),
    isAnonymous: boolean('is_anonymous').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('uq_users_player_code').on(table.playerCode),
    index('idx_users_role').on(table.role),
  ]
);

export const accounts = pgTable(
  'accounts',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    accountId: text('account_id').notNull(), // technical email e.g. fox-xxxx-yyy@finspire.invalid
    providerId: text('provider_id').notNull().default('credential'),
    passwordHash: text('password_hash'), // Argon2id hash
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('uq_accounts_provider_account').on(table.providerId, table.accountId),
    index('idx_accounts_user_id').on(table.userId),
  ]
);

export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    token: text('token').notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_sessions_user_id').on(table.userId),
    index('idx_sessions_expires_at').on(table.expiresAt),
  ]
);
