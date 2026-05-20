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

export type Outlet = typeof outlets.$inferSelect;
export type NewOutlet = typeof outlets.$inferInsert;
export type Story = typeof stories.$inferSelect;
export type NewStory = typeof stories.$inferInsert;
export type Article = typeof articles.$inferSelect;
export type NewArticle = typeof articles.$inferInsert;
export type Vote = typeof votes.$inferSelect;
export type NewVote = typeof votes.$inferInsert;
