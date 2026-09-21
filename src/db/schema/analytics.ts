import { pgTable, uuid, text, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users';
import { clientInstallations } from './installations';

export const analyticsEvents = pgTable(
  'analytics_events',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    eventName: text('event_name').notNull(), // e.g. 'chapter_start', 'chapter_complete', 'sync_completed'
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    installationId: uuid('installation_id').references(() => clientInstallations.id, { onDelete: 'set null' }),
    eventPayload: jsonb('event_payload').$type<Record<string, unknown>>().notNull().default({}),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
    recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_analytics_event_name').on(table.eventName),
    index('idx_analytics_occurred_at').on(table.occurredAt),
  ]
);
