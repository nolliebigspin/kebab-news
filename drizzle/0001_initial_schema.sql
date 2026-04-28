CREATE TYPE "public"."topic_status" AS ENUM('voting', 'investigating', 'done');--> statement-breakpoint
CREATE TABLE "topics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"original_submission" text NOT NULL,
	"neutral_rewrite" text,
	"status" "topic_status" DEFAULT 'voting' NOT NULL,
	"vote_count" integer DEFAULT 0 NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"trust_score" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- NOTE: drizzle-kit emits CREATE TABLE for neon_auth.users_sync because the
-- usersSync helper is referenced in our schema for typing. We REMOVE that
-- statement here — Neon Auth owns and provisions neon_auth.users_sync. Phase 2
-- enables Neon Auth on the project, after which the cross-schema FK from
-- public.users.id → neon_auth.users_sync.id will be added back to schema.ts.

CREATE TABLE "votes" (
	"user_id" text NOT NULL,
	"topic_id" uuid NOT NULL,
	"week_bucket" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "votes_user_topic_week_unique" UNIQUE("user_id","topic_id","week_bucket")
);
--> statement-breakpoint
ALTER TABLE "topics" ADD CONSTRAINT "topics_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;