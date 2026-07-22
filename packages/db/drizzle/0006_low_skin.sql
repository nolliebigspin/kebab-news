CREATE TYPE "public"."downvote_reason" AS ENUM('missing_information', 'misleading', 'unbalanced_sources', 'weak_framing_analysis', 'outdated', 'factual_error', 'other');--> statement-breakpoint
CREATE TYPE "public"."moderation_status" AS ENUM('visible', 'pending', 'hidden', 'deleted');--> statement-breakpoint
CREATE TYPE "public"."share_channel" AS ENUM('native', 'copy', 'x', 'linkedin', 'facebook', 'whatsapp', 'telegram', 'email');--> statement-breakpoint
CREATE TYPE "public"."summary_status" AS ENUM('draft', 'processing', 'needs_review', 'published', 'updated', 'corrected', 'archived');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'moderator', 'editor', 'admin');--> statement-breakpoint
CREATE TABLE "article_authors" (
	"article_id" uuid NOT NULL,
	"author_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "authors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comment_helpful_votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"comment_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comment_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"comment_id" uuid NOT NULL,
	"reporter_id" text NOT NULL,
	"reason" text NOT NULL,
	"status" "moderation_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"summary_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"parent_id" uuid,
	"content" text NOT NULL,
	"moderation_status" "moderation_status" DEFAULT 'visible' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "share_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"summary_id" uuid NOT NULL,
	"channel" "share_channel" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "summary_ratings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"summary_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"value" integer NOT NULL,
	"downvote_reason" "downvote_reason",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "language" text DEFAULT 'de' NOT NULL;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "relevant_excerpt" text;--> statement-breakpoint
ALTER TABLE "published_articles" ADD COLUMN "short_summary" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "published_articles" ADD COLUMN "body_paragraphs" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "published_articles" ADD COLUMN "confirmed_facts" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "published_articles" ADD COLUMN "uncertainties" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "published_articles" ADD COLUMN "source_differences" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "published_articles" ADD COLUMN "body_annotations" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "published_articles" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "published_articles" ADD COLUMN "status" "summary_status" DEFAULT 'needs_review' NOT NULL;--> statement-breakpoint
ALTER TABLE "published_articles" ADD COLUMN "content_origin" text DEFAULT 'automatic' NOT NULL;--> statement-breakpoint
ALTER TABLE "published_articles" ADD COLUMN "change_summary" text;--> statement-breakpoint
ALTER TABLE "published_articles" ADD COLUMN "correction_note" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "role" "user_role" DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "article_authors" ADD CONSTRAINT "article_authors_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article_authors" ADD CONSTRAINT "article_authors_author_id_authors_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."authors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment_helpful_votes" ADD CONSTRAINT "comment_helpful_votes_comment_id_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment_helpful_votes" ADD CONSTRAINT "comment_helpful_votes_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment_reports" ADD CONSTRAINT "comment_reports_comment_id_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment_reports" ADD CONSTRAINT "comment_reports_reporter_id_user_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_summary_id_published_articles_id_fk" FOREIGN KEY ("summary_id") REFERENCES "public"."published_articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_id_comments_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "share_events" ADD CONSTRAINT "share_events_summary_id_published_articles_id_fk" FOREIGN KEY ("summary_id") REFERENCES "public"."published_articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "summary_ratings" ADD CONSTRAINT "summary_ratings_summary_id_published_articles_id_fk" FOREIGN KEY ("summary_id") REFERENCES "public"."published_articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "summary_ratings" ADD CONSTRAINT "summary_ratings_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "article_authors_unique" ON "article_authors" USING btree ("article_id","author_id");--> statement-breakpoint
CREATE UNIQUE INDEX "comment_helpful_user_unique" ON "comment_helpful_votes" USING btree ("comment_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "comment_reports_comment_user_unique" ON "comment_reports" USING btree ("comment_id","reporter_id");--> statement-breakpoint
CREATE INDEX "comments_summary_idx" ON "comments" USING btree ("summary_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "comments_parent_idx" ON "comments" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "share_events_summary_idx" ON "share_events" USING btree ("summary_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "summary_ratings_summary_user_unique" ON "summary_ratings" USING btree ("summary_id","user_id");--> statement-breakpoint
CREATE INDEX "summary_ratings_summary_idx" ON "summary_ratings" USING btree ("summary_id");