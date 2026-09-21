import { pgTable, uuid, text, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users';

export const clientInstallations = pgTable(
  'client_installations',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    installationUuid: uuid('installation_uuid').notNull(),
    clientPlatform: text('client_platform').notNull().default('web_pwa'), // 'web_pwa', 'android_twa', 'desktop_browser'
    appVersion: text('app_version').notNull().default('1.0.0'),
    lastSyncAt: timestamp('last_sync_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('uq_installation_uuid').on(table.installationUuid),
    index('idx_installations_user').on(table.userId),
  ]
);
