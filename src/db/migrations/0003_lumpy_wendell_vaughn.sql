CREATE TABLE "microlearning_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attempt_id" uuid NOT NULL,
	"installation_id" uuid,
	"action_id" uuid NOT NULL,
	"client_sequence" integer NOT NULL,
	"scene_node_id" text NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "microlearning_actions_action_id_unique" UNIQUE("action_id")
);
--> statement-breakpoint
ALTER TABLE "microlearning_actions" ADD CONSTRAINT "microlearning_actions_attempt_id_playthrough_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."playthrough_attempts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "microlearning_actions" ADD CONSTRAINT "microlearning_actions_installation_id_client_installations_id_fk" FOREIGN KEY ("installation_id") REFERENCES "public"."client_installations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_microlearning_attempt_node" ON "microlearning_actions" USING btree ("attempt_id","scene_node_id");--> statement-breakpoint
CREATE INDEX "idx_microlearning_actions_seq" ON "microlearning_actions" USING btree ("installation_id","client_sequence");--> statement-breakpoint
CREATE SEQUENCE IF NOT EXISTS "action_receipt_seq";