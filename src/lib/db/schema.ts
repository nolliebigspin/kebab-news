import { sql } from "drizzle-orm";
import { usersSync } from "drizzle-orm/neon";
import { integer, pgEnum, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";

/**
 * usersSync is owned by Neon Auth (lives in neon_auth schema, never in our migrations).
 * Re-exported so app code can `import { usersSync } from "@/lib/db"`.
 *
 * usersSync.id is text (verified from drizzle-orm@0.45.2/neon/neon-auth.js).
 * Therefore public.users.id MUST be text to satisfy the FK type match.
 */
export { usersSync };

// public.users — profile-only; identity is in neon_auth.users_sync
export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .references(() => usersSync.id, { onDelete: "cascade" }),
  trustScore: integer("trust_score").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// topics
export const topicStatusValues = ["voting", "investigating", "done"] as const;
export const topicStatusEnum = pgEnum("topic_status", topicStatusValues);
export type TopicStatus = (typeof topicStatusValues)[number];

export const topics = pgTable("topics", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  originalSubmission: text("original_submission").notNull(),
  neutralRewrite: text("neutral_rewrite"),
  status: topicStatusEnum("status").notNull().default("voting"),
  voteCount: integer("vote_count").notNull().default(0),
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// votes
export const votes = pgTable(
  "votes",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    topicId: uuid("topic_id")
      .notNull()
      .references(() => topics.id, { onDelete: "cascade" }),
    weekBucket: text("week_bucket").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("votes_user_topic_week_unique").on(t.userId, t.topicId, t.weekBucket)]
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Topic = typeof topics.$inferSelect;
export type NewTopic = typeof topics.$inferInsert;
export type Vote = typeof votes.$inferSelect;
export type NewVote = typeof votes.$inferInsert;
