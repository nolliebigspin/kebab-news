CREATE TYPE "public"."outlet_lean" AS ENUM('left', 'center-left', 'center', 'center-right', 'right', 'right-fringe', 'public');--> statement-breakpoint
CREATE TABLE "articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"outlet_id" uuid NOT NULL,
	"url" text NOT NULL,
	"headline" text NOT NULL,
	"teaser" text,
	"headline_annotations" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"teaser_annotations" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"published_at" timestamp with time zone NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	"embedding" vector(512),
	"story_id" uuid
);
--> statement-breakpoint
CREATE TABLE "outlets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"political_lean" "outlet_lean" NOT NULL,
	"feed_url" text NOT NULL,
	"homepage_url" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "outlets_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "stories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"label" text NOT NULL,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"centroid" vector(512) NOT NULL,
	"article_count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "stories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_outlet_id_outlets_id_fk" FOREIGN KEY ("outlet_id") REFERENCES "public"."outlets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "articles_url_unique" ON "articles" USING btree ("url");--> statement-breakpoint
CREATE INDEX "articles_published_at_idx" ON "articles" USING btree ("published_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "articles_story_id_idx" ON "articles" USING btree ("story_id");--> statement-breakpoint
CREATE INDEX "stories_last_seen_at_idx" ON "stories" USING btree ("last_seen_at" DESC NULLS LAST);