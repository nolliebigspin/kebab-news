import { sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

describe("votes composite unique (INFRA-03)", () => {
  const userId = "test-user-id-votes-uniq";
  let topicId: string;

  beforeAll(async () => {
    if (process.env.PHASE_1_DB_READY !== "1") return;
    const { db, users, topics } = await import("@/lib/db");
    await db.execute(sql`TRUNCATE TABLE votes, topics, users CASCADE`);
    await db.insert(users).values({ id: userId });
    const [topic] = await db
      .insert(topics)
      .values({ title: "test", originalSubmission: "test", createdBy: userId })
      .returning({ id: topics.id });
    topicId = topic.id;
  });

  afterAll(async () => {
    if (process.env.PHASE_1_DB_READY !== "1") return;
    const { db } = await import("@/lib/db");
    await db.execute(sql`TRUNCATE TABLE votes, topics, users CASCADE`);
  });

  it("rejects duplicate (user_id, topic_id, week_bucket)", async () => {
    if (process.env.PHASE_1_DB_READY !== "1") {
      throw new Error(
        "MISSING — Plan 03 must create votes table with unique constraint " +
          "votes_user_topic_week_unique. Plan 05 must run migration. " +
          "Set PHASE_1_DB_READY=1 after that."
      );
    }
    const { db, votes } = await import("@/lib/db");
    const weekBucket = "2026-W17";
    await db.insert(votes).values({ userId, topicId, weekBucket });

    // Drizzle wraps the pg error in a "Failed query" message; the original
    // pg error (with constraint name) is on the cause chain.
    let caught: unknown;
    try {
      await db.insert(votes).values({ userId, topicId, weekBucket });
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeDefined();
    const errStr = JSON.stringify(caught, Object.getOwnPropertyNames(caught as object));
    expect(errStr).toMatch(/duplicate key|unique constraint|votes_user_topic_week_unique/i);
  });
});
