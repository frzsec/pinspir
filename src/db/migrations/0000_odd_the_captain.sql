CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text DEFAULT 'credential' NOT NULL,
	"password_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role" text DEFAULT 'student' NOT NULL,
	"player_code" text,
	"nickname" text DEFAULT 'Petualang' NOT NULL,
	"avatar_config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_anonymous" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "cohort_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cohort_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cohorts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"teacher_id" uuid NOT NULL,
	"name" text NOT NULL,
	"cohort_code" text NOT NULL,
	"academic_year" text DEFAULT '2025/2026' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cohorts_cohort_code_unique" UNIQUE("cohort_code")
);
--> statement-breakpoint
CREATE TABLE "schools" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"npsn" text,
	"city" text DEFAULT '' NOT NULL,
	"province" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "schools_npsn_unique" UNIQUE("npsn")
);
--> statement-breakpoint
CREATE TABLE "credential_reset_audits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"target_user_id" uuid NOT NULL,
	"teacher_id" uuid NOT NULL,
	"cohort_id" uuid NOT NULL,
	"reason" text DEFAULT 'Reset sandi murid terbimbing di kelas' NOT NULL,
	"reset_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_consents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"consent_type" text NOT NULL,
	"granted" boolean DEFAULT false NOT NULL,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "client_installations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"installation_uuid" uuid NOT NULL,
	"client_platform" text DEFAULT 'web_pwa' NOT NULL,
	"app_version" text DEFAULT '1.0.0' NOT NULL,
	"last_sync_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_releases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"release_id" text NOT NULL,
	"schema_version" text DEFAULT '2020-12' NOT NULL,
	"title" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"manifest_json" jsonb NOT NULL,
	"manifest_sha256" text NOT NULL,
	"activated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "content_releases_release_id_unique" UNIQUE("release_id")
);
--> statement-breakpoint
CREATE TABLE "gameplay_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attempt_id" uuid NOT NULL,
	"installation_id" uuid,
	"action_id" uuid NOT NULL,
	"client_sequence" integer NOT NULL,
	"scene_node_id" text NOT NULL,
	"choice_id" text NOT NULL,
	"action_payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gameplay_actions_action_id_unique" UNIQUE("action_id")
);
--> statement-breakpoint
CREATE TABLE "playthrough_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"installation_id" uuid,
	"release_id" text NOT NULL,
	"chapter_id" text NOT NULL,
	"attempt_number" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'in_progress' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"score_mastery" integer DEFAULT 0 NOT NULL,
	"outcome_tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	CONSTRAINT "chk_attempts_score_non_negative" CHECK ("playthrough_attempts"."score_mastery" >= 0)
);
--> statement-breakpoint
CREATE TABLE "reward_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"release_id" text NOT NULL,
	"source_node_id" text NOT NULL,
	"attempt_id" uuid,
	"reward_type" text NOT NULL,
	"amount" integer DEFAULT 0 NOT NULL,
	"reason" text DEFAULT 'Mastery check completed' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_reward_amount_non_negative" CHECK ("reward_ledger"."amount" >= 0)
);
--> statement-breakpoint
CREATE TABLE "player_projections" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"total_xp" integer DEFAULT 0 NOT NULL,
	"total_stars" integer DEFAULT 0 NOT NULL,
	"completed_chapters" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"last_activity_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_projections_xp_non_negative" CHECK ("player_projections"."total_xp" >= 0),
	CONSTRAINT "chk_projections_stars_non_negative" CHECK ("player_projections"."total_stars" >= 0)
);
--> statement-breakpoint
CREATE TABLE "player_streaks" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"longest_streak" integer DEFAULT 0 NOT NULL,
	"last_activity_date" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_streaks_current_non_negative" CHECK ("player_streaks"."current_streak" >= 0),
	CONSTRAINT "chk_streaks_longest_non_negative" CHECK ("player_streaks"."longest_streak" >= 0)
);
--> statement-breakpoint
CREATE TABLE "analytics_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_name" text NOT NULL,
	"user_id" uuid,
	"installation_id" uuid,
	"event_payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cohort_members" ADD CONSTRAINT "cohort_members_cohort_id_cohorts_id_fk" FOREIGN KEY ("cohort_id") REFERENCES "public"."cohorts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cohort_members" ADD CONSTRAINT "cohort_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cohorts" ADD CONSTRAINT "cohorts_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cohorts" ADD CONSTRAINT "cohorts_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credential_reset_audits" ADD CONSTRAINT "credential_reset_audits_target_user_id_users_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credential_reset_audits" ADD CONSTRAINT "credential_reset_audits_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credential_reset_audits" ADD CONSTRAINT "credential_reset_audits_cohort_id_cohorts_id_fk" FOREIGN KEY ("cohort_id") REFERENCES "public"."cohorts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_consents" ADD CONSTRAINT "user_consents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_installations" ADD CONSTRAINT "client_installations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gameplay_actions" ADD CONSTRAINT "gameplay_actions_attempt_id_playthrough_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."playthrough_attempts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gameplay_actions" ADD CONSTRAINT "gameplay_actions_installation_id_client_installations_id_fk" FOREIGN KEY ("installation_id") REFERENCES "public"."client_installations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playthrough_attempts" ADD CONSTRAINT "playthrough_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playthrough_attempts" ADD CONSTRAINT "playthrough_attempts_installation_id_client_installations_id_fk" FOREIGN KEY ("installation_id") REFERENCES "public"."client_installations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playthrough_attempts" ADD CONSTRAINT "playthrough_attempts_release_id_content_releases_release_id_fk" FOREIGN KEY ("release_id") REFERENCES "public"."content_releases"("release_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_ledger" ADD CONSTRAINT "reward_ledger_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_ledger" ADD CONSTRAINT "reward_ledger_release_id_content_releases_release_id_fk" FOREIGN KEY ("release_id") REFERENCES "public"."content_releases"("release_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_ledger" ADD CONSTRAINT "reward_ledger_attempt_id_playthrough_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."playthrough_attempts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_projections" ADD CONSTRAINT "player_projections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_streaks" ADD CONSTRAINT "player_streaks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_installation_id_client_installations_id_fk" FOREIGN KEY ("installation_id") REFERENCES "public"."client_installations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_accounts_provider_account" ON "accounts" USING btree ("provider_id","account_id");--> statement-breakpoint
CREATE INDEX "idx_accounts_user_id" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_sessions_user_id" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_sessions_expires_at" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_users_player_code" ON "users" USING btree ("player_code");--> statement-breakpoint
CREATE INDEX "idx_users_role" ON "users" USING btree ("role");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_cohort_member" ON "cohort_members" USING btree ("cohort_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_cohort_members_user" ON "cohort_members" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_cohorts_code" ON "cohorts" USING btree ("cohort_code");--> statement-breakpoint
CREATE INDEX "idx_cohorts_teacher" ON "cohorts" USING btree ("teacher_id");--> statement-breakpoint
CREATE INDEX "idx_cohorts_school" ON "cohorts" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "idx_schools_npsn" ON "schools" USING btree ("npsn");--> statement-breakpoint
CREATE INDEX "idx_reset_audits_target" ON "credential_reset_audits" USING btree ("target_user_id");--> statement-breakpoint
CREATE INDEX "idx_reset_audits_teacher" ON "credential_reset_audits" USING btree ("teacher_id");--> statement-breakpoint
CREATE INDEX "idx_user_consents_user" ON "user_consents" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_installation_uuid" ON "client_installations" USING btree ("installation_uuid");--> statement-breakpoint
CREATE INDEX "idx_installations_user" ON "client_installations" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_content_releases_release_id" ON "content_releases" USING btree ("release_id");--> statement-breakpoint
CREATE INDEX "idx_content_releases_status" ON "content_releases" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_gameplay_attempt_node" ON "gameplay_actions" USING btree ("attempt_id","scene_node_id");--> statement-breakpoint
CREATE INDEX "idx_gameplay_actions_seq" ON "gameplay_actions" USING btree ("installation_id","client_sequence");--> statement-breakpoint
CREATE INDEX "idx_attempts_user_chapter" ON "playthrough_attempts" USING btree ("user_id","chapter_id");--> statement-breakpoint
CREATE INDEX "idx_attempts_status" ON "playthrough_attempts" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_reward_ledger_source" ON "reward_ledger" USING btree ("user_id","release_id","source_node_id","reward_type");--> statement-breakpoint
CREATE INDEX "idx_reward_ledger_user" ON "reward_ledger" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_analytics_event_name" ON "analytics_events" USING btree ("event_name");--> statement-breakpoint
CREATE INDEX "idx_analytics_occurred_at" ON "analytics_events" USING btree ("occurred_at");