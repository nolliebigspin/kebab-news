DROP INDEX "votes_story_ip_day_unique";--> statement-breakpoint
DROP INDEX "votes_story_day_idx";--> statement-breakpoint
ALTER TABLE "votes" ADD COLUMN "user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "votes_story_user_unique" ON "votes" USING btree ("story_id","user_id");--> statement-breakpoint
CREATE INDEX "votes_story_idx" ON "votes" USING btree ("story_id");--> statement-breakpoint
ALTER TABLE "votes" DROP COLUMN "ip_hash";--> statement-breakpoint
ALTER TABLE "votes" DROP COLUMN "day_bucket";