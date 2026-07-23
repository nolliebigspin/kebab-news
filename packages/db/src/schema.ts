import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  boolean,
  check,
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

export const sourceKindValues = ["primary", "secondary"] as const;
export const sourceKindEnum = pgEnum("source_kind", sourceKindValues);
export type SourceKind = (typeof sourceKindValues)[number];

export const userRoleValues = ["user", "moderator", "editor", "admin"] as const;
export const userRoleEnum = pgEnum("user_role", userRoleValues);
export type UserRole = (typeof userRoleValues)[number];

export const summaryStatusValues = [
  "draft",
  "processing",
  "needs_review",
  "published",
  "updated",
  "corrected",
  "archived",
] as const;
export const summaryStatusEnum = pgEnum("summary_status", summaryStatusValues);
export type SummaryStatus = (typeof summaryStatusValues)[number];

export const moderationStatusValues = ["visible", "pending", "hidden", "deleted"] as const;
export const moderationStatusEnum = pgEnum("moderation_status", moderationStatusValues);
export type ModerationStatus = (typeof moderationStatusValues)[number];

export const downvoteReasonValues = [
  "missing_information",
  "misleading",
  "unbalanced_sources",
  "weak_framing_analysis",
  "outdated",
  "factual_error",
  "other",
] as const;
export const downvoteReasonEnum = pgEnum("downvote_reason", downvoteReasonValues);
export type DownvoteReason = (typeof downvoteReasonValues)[number];

export const shareChannelValues = [
  "native",
  "copy",
  "x",
  "linkedin",
  "facebook",
  "whatsapp",
  "telegram",
  "email",
] as const;
export const shareChannelEnum = pgEnum("share_channel", shareChannelValues);
export type ShareChannel = (typeof shareChannelValues)[number];

export const outlets = pgTable("outlets", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  politicalLean: outletLeanEnum("political_lean").notNull(),
  feedUrl: text("feed_url").notNull(),
  homepageUrl: text("homepage_url").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const authors = pgTable("authors", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
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
    language: text("language").notNull().default("de"),
    sourceKind: sourceKindEnum("source_kind").notNull().default("secondary"),
    headlineAnnotations: jsonb("headline_annotations").notNull().default(sql`'[]'::jsonb`),
    teaserAnnotations: jsonb("teaser_annotations").notNull().default(sql`'[]'::jsonb`),
    annotationVersion: text("annotation_version"),
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

export const articleAuthors = pgTable(
  "article_authors",
  {
    articleId: uuid("article_id")
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => authors.id, { onDelete: "cascade" }),
  },
  (t) => [uniqueIndex("article_authors_unique").on(t.articleId, t.authorId)]
);

/**
 * Reader votes on radar stories. One vote per (story, user) — the unique
 * constraint enforces "one vote per account per story", permanently (votes
 * accumulate across days until a story clears REWRITE_VOTE_THRESHOLD). Voting
 * requires a logged-in account; there is no anonymous/IP path anymore.
 */
export const votes = pgTable(
  "votes",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    storyId: uuid("story_id")
      .notNull()
      .references(() => stories.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("votes_story_user_unique").on(t.storyId, t.userId),
    index("votes_story_idx").on(t.storyId),
  ]
);

/**
 * AI-rewritten neutral version of a story. Created as a draft (published_at
 * NULL) by `bun rewrite:run`, flipped to live (published_at = now()) by
 * `bun rewrite:publish`. The source article bodies are NOT stored — only the
 * rewrite itself plus immutable article-level receipts on /artikel/[slug].
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
    shortSummary: text("short_summary").notNull().default(""),
    bodyParagraphs: jsonb("body_paragraphs").notNull().default(sql`'[]'::jsonb`),
    confirmedFacts: jsonb("confirmed_facts").notNull().default(sql`'[]'::jsonb`),
    uncertainties: jsonb("uncertainties").notNull().default(sql`'[]'::jsonb`),
    sourceDifferences: jsonb("source_differences").notNull().default(sql`'[]'::jsonb`),
    bodyAnnotations: jsonb("body_annotations").notNull().default(sql`'[]'::jsonb`),
    sourceCount: integer("source_count").notNull(),
    sourceOutletSlugs: text("source_outlet_slugs").array().notNull(),
    model: text("model").notNull(),
    promptVersion: text("prompt_version").notNull(),
    version: integer("version").notNull().default(1),
    status: summaryStatusEnum("status").notNull().default("needs_review"),
    contentOrigin: text("content_origin").notNull().default("automatic"),
    changeSummary: text("change_summary"),
    correctionNote: text("correction_note"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    reviewedBy: text("reviewed_by"),
    rewrittenAt: timestamp("rewritten_at", { withTimezone: true }).notNull().defaultNow(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
  },
  (t) => [
    index("published_articles_published_at_idx").on(t.publishedAt.desc()),
    index("published_articles_story_id_idx").on(t.storyId),
  ]
);

/** Immutable receipt set for one concrete summary version. */
export const summarySources = pgTable(
  "summary_sources",
  {
    summaryId: uuid("summary_id")
      .notNull()
      .references(() => publishedArticles.id, { onDelete: "cascade" }),
    articleId: uuid("article_id")
      .notNull()
      .references(() => articles.id, { onDelete: "restrict" }),
    usedFor: text("used_for"),
  },
  (t) => [
    uniqueIndex("summary_sources_unique").on(t.summaryId, t.articleId),
    index("summary_sources_article_idx").on(t.articleId),
  ]
);

/** Quality rating of a published summary, not political agreement. */
export const summaryRatings = pgTable(
  "summary_ratings",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    summaryId: uuid("summary_id")
      .notNull()
      .references(() => publishedArticles.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    value: integer("value").notNull(),
    downvoteReason: downvoteReasonEnum("downvote_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("summary_ratings_summary_user_unique").on(t.summaryId, t.userId),
    index("summary_ratings_summary_idx").on(t.summaryId),
    check("summary_ratings_value_check", sql`${t.value} in (-1, 1)`),
  ]
);

export const comments = pgTable(
  "comments",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    summaryId: uuid("summary_id")
      .notNull()
      .references(() => publishedArticles.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    parentId: uuid("parent_id").references((): AnyPgColumn => comments.id, {
      onDelete: "cascade",
    }),
    content: text("content").notNull(),
    moderationStatus: moderationStatusEnum("moderation_status").notNull().default("visible"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    index("comments_summary_idx").on(t.summaryId, t.createdAt.desc()),
    index("comments_parent_idx").on(t.parentId),
  ]
);

export const commentHelpfulVotes = pgTable(
  "comment_helpful_votes",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    commentId: uuid("comment_id")
      .notNull()
      .references(() => comments.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("comment_helpful_user_unique").on(t.commentId, t.userId)]
);

export const commentReports = pgTable(
  "comment_reports",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    commentId: uuid("comment_id")
      .notNull()
      .references(() => comments.id, { onDelete: "cascade" }),
    reporterId: text("reporter_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    reason: text("reason").notNull(),
    status: moderationStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("comment_reports_comment_user_unique").on(t.commentId, t.reporterId)]
);

/** Anonymous, content-level share analytics: no account, IP or user agent. */
export const shareEvents = pgTable(
  "share_events",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    summaryId: uuid("summary_id")
      .notNull()
      .references(() => publishedArticles.id, { onDelete: "cascade" }),
    channel: shareChannelEnum("channel").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("share_events_summary_idx").on(t.summaryId, t.createdAt.desc())]
);

/**
 * Better Auth core tables. These are the canonical shapes Better Auth's
 * Drizzle adapter expects (provider: "pg", singular table names, text ids).
 * They are defined here so the whole schema stays single-source for
 * drizzle-kit (§VI #4) rather than living in a CLI-generated file.
 *
 * The magic-link plugin reuses the `verification` table for its tokens — it
 * does NOT add its own table. Property keys are camelCase (Better Auth maps
 * by key); DB columns are snake_case to match the rest of the schema.
 */
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  role: userRoleEnum("role").notNull().default("user"),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

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
export type SummaryRating = typeof summaryRatings.$inferSelect;
export type NewSummaryRating = typeof summaryRatings.$inferInsert;
export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;
export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
export type Session = typeof session.$inferSelect;
export type NewSession = typeof session.$inferInsert;
