import { sql } from "drizzle-orm";
import {
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  vector,
} from "drizzle-orm/pg-core";

export const EMBEDDING_DIMENSIONS = 512;

export const outletLeanValues = [
  "left",
  "center-left",
  "center",
  "center-right",
  "right",
  "right-fringe",
  "public",
] as const;
export const outletLeanEnum = pgEnum("outlet_lean", outletLeanValues);
export type OutletLean = (typeof outletLeanValues)[number];

export const outlets = pgTable("outlets", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  politicalLean: outletLeanEnum("political_lean").notNull(),
  feedUrl: text("feed_url").notNull(),
  homepageUrl: text("homepage_url").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const stories = pgTable(
  "stories",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    slug: text("slug").notNull().unique(),
    label: text("label").notNull(),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
    centroid: vector("centroid", { dimensions: EMBEDDING_DIMENSIONS }).notNull(),
    articleCount: integer("article_count").notNull().default(0),
    // Back-pointer to the currently-published rewrite, if any. Nullable —
    // most stories never get a rewrite. Updated by `bun rewrite:publish`.
    // Typed as uuid here; the FK is declared inline on publishedArticles to
    // avoid a circular dependency, and enforced via a separate migration.
    publishedArticleId: uuid("published_article_id"),
  },
  (t) => [index("stories_last_seen_at_idx").on(t.lastSeenAt.desc())]
);

export const articles = pgTable(
  "articles",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    outletId: uuid("outlet_id")
      .notNull()
      .references(() => outlets.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    headline: text("headline").notNull(),
    teaser: text("teaser"),
    headlineAnnotations: jsonb("headline_annotations").notNull().default(sql`'[]'::jsonb`),
    teaserAnnotations: jsonb("teaser_annotations").notNull().default(sql`'[]'::jsonb`),
    publishedAt: timestamp("published_at", { withTimezone: true }).notNull(),
    fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
    embedding: vector("embedding", { dimensions: EMBEDDING_DIMENSIONS }),
    storyId: uuid("story_id").references(() => stories.id, { onDelete: "set null" }),
  },
  (t) => [
    uniqueIndex("articles_url_unique").on(t.url),
    index("articles_published_at_idx").on(t.publishedAt.desc()),
    index("articles_story_id_idx").on(t.storyId),
  ]
);

/**
 * Reader votes on radar stories. One vote per (story, ip_hash, day_bucket) —
 * the unique constraint enforces "one vote per IP per story per day". Raw IPs
 * never land here; we store sha256(ip + VOTE_DAILY_SALT) so the bucket rotates
 * daily and the original IP is unrecoverable for DSGVO compliance.
 */
export const votes = pgTable(
  "votes",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    storyId: uuid("story_id")
      .notNull()
      .references(() => stories.id, { onDelete: "cascade" }),
    ipHash: text("ip_hash").notNull(),
    dayBucket: date("day_bucket").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("votes_story_ip_day_unique").on(t.storyId, t.ipHash, t.dayBucket),
    index("votes_story_day_idx").on(t.storyId, t.dayBucket),
  ]
);

/**
 * AI-rewritten neutral version of a story. Created as a draft (published_at
 * NULL) by `bun rewrite:run`, flipped to live (published_at = now()) by
 * `bun rewrite:publish`. The source article bodies are NOT stored — only the
 * rewrite itself plus per-source slugs for receipts on /articles/[slug].
 *
 * `model` + `promptVersion` are stamped on every row so we can identify
 * outputs that came from an older prompt and re-run them if needed.
 */
export const publishedArticles = pgTable(
  "published_articles",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    // RESTRICT: never silently drop a published rewrite when its source
    // story is deleted. Operator must clean up the rewrite first.
    storyId: uuid("story_id")
      .notNull()
      .references(() => stories.id, { onDelete: "restrict" }),
    slug: text("slug").notNull().unique(),
    neutralHeadline: text("neutral_headline").notNull(),
    neutralBody: text("neutral_body").notNull(),
    sourceCount: integer("source_count").notNull(),
    sourceOutletSlugs: text("source_outlet_slugs").array().notNull(),
    model: text("model").notNull(),
    promptVersion: text("prompt_version").notNull(),
    rewrittenAt: timestamp("rewritten_at", { withTimezone: true }).notNull().defaultNow(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
  },
  (t) => [
    index("published_articles_published_at_idx").on(t.publishedAt.desc()),
    index("published_articles_story_id_idx").on(t.storyId),
  ]
);

export type Outlet = typeof outlets.$inferSelect;
export type NewOutlet = typeof outlets.$inferInsert;
export type Story = typeof stories.$inferSelect;
export type NewStory = typeof stories.$inferInsert;
export type Article = typeof articles.$inferSelect;
export type NewArticle = typeof articles.$inferInsert;
export type Vote = typeof votes.$inferSelect;
export type NewVote = typeof votes.$inferInsert;
export type PublishedArticle = typeof publishedArticles.$inferSelect;
export type NewPublishedArticle = typeof publishedArticles.$inferInsert;
