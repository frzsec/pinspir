CREATE TABLE "rate_limit_entries" (
	"key" text PRIMARY KEY NOT NULL,
	"count" integer DEFAULT 1 NOT NULL,
	"reset_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
DROP INDEX "uq_reward_ledger_source";--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "idle_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email" text;--> statement-breakpoint
ALTER TABLE "playthrough_attempts" ADD COLUMN "canonical_state_json" jsonb;--> statement-breakpoint
ALTER TABLE "playthrough_attempts" ADD COLUMN "current_node_id" text;--> statement-breakpoint
ALTER TABLE "playthrough_attempts" ADD COLUMN "pinned_release_id" text;--> statement-breakpoint
CREATE INDEX "idx_rate_limit_reset" ON "rate_limit_entries" USING btree ("reset_at");--> statement-breakpoint
CREATE INDEX "idx_sessions_idle_expires_at" ON "sessions" USING btree ("idle_expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_users_email" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_reward_ledger_attempt" ON "reward_ledger" USING btree ("attempt_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_reward_ledger_source_v2" ON "reward_ledger" USING btree ("user_id", "release_id", "source_node_id", "reward_type", "attempt_id") WHERE "attempt_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_reward_ledger_source_noattempt" ON "reward_ledger" USING btree ("user_id", "release_id", "source_node_id", "reward_type") WHERE "attempt_id" IS NULL;