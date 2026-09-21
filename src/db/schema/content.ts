import { pgTable, uuid, text, timestamp, jsonb, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const contentReleases = pgTable(
  'content_releases',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    releaseId: text('release_id').notNull().unique(), // e.g. 'pilot-v1-draft', '2026.03-v1'
    schemaVersion: text('schema_version').notNull().default('2020-12'),
    title: text('title').notNull(),
    status: text('status').notNull().default('draft'), // 'draft', 'validated', 'staged', 'active', 'deprecated', 'rolled_back', 'archived'
    manifestJson: jsonb('manifest_json').$type<Record<string, unknown>>().notNull(),
    manifestSha256: text('manifest_sha256').notNull(),
    activatedAt: timestamp('activated_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('uq_content_releases_release_id').on(table.releaseId),
    index('idx_content_releases_status').on(table.status),
  ]
);
