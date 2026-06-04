CREATE TABLE "votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"story_id" uuid NOT NULL,
	"ip_hash" text NOT NULL,
	"day_bucket" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "votes_story_ip_day_unique" ON "votes" USING btree ("story_id","ip_hash","day_bucket");--> statement-breakpoint
CREATE INDEX "votes_story_day_idx" ON "votes" USING btree ("story_id","day_bucket");