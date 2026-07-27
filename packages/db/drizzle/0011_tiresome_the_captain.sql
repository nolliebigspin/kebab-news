CREATE TABLE "ai_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text NOT NULL,
	"task" text NOT NULL,
	"model" text NOT NULL,
	"status" text DEFAULT 'reserved' NOT NULL,
	"reserved_cost_micro_usd" integer NOT NULL,
	"actual_cost_micro_usd" integer,
	"input_tokens" integer,
	"output_tokens" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "ai_usage_created_at_idx" ON "ai_usage" USING btree ("created_at" DESC NULLS LAST);