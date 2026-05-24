CREATE TABLE "published_articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"story_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"neutral_headline" text NOT NULL,
	"neutral_body" text NOT NULL,
	"source_count" integer NOT NULL,
	"source_outlet_slugs" text[] NOT NULL,
	"model" text NOT NULL,
	"prompt_version" text NOT NULL,
	"rewritten_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone,
	CONSTRAINT "published_articles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "stories" ADD COLUMN "published_article_id" uuid;--> statement-breakpoint
ALTER TABLE "published_articles" ADD CONSTRAINT "published_articles_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "published_articles_published_at_idx" ON "published_articles" USING btree ("published_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "published_articles_story_id_idx" ON "published_articles" USING btree ("story_id");