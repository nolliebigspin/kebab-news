CREATE TYPE "public"."source_kind" AS ENUM('primary', 'secondary');--> statement-breakpoint
CREATE TABLE "summary_sources" (
	"summary_id" uuid NOT NULL,
	"article_id" uuid NOT NULL,
	"used_for" text
);
--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "source_kind" "source_kind" DEFAULT 'secondary' NOT NULL;--> statement-breakpoint
ALTER TABLE "published_articles" ADD COLUMN "reviewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "summary_sources" ADD CONSTRAINT "summary_sources_summary_id_published_articles_id_fk" FOREIGN KEY ("summary_id") REFERENCES "public"."published_articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "summary_sources" ADD CONSTRAINT "summary_sources_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "summary_sources_unique" ON "summary_sources" USING btree ("summary_id","article_id");--> statement-breakpoint
CREATE INDEX "summary_sources_article_idx" ON "summary_sources" USING btree ("article_id");--> statement-breakpoint
ALTER TABLE "articles" DROP COLUMN "relevant_excerpt";