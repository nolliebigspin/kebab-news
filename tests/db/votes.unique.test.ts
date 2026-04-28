import { describe, expect, it } from "vitest";

describe("votes composite unique (INFRA-03)", () => {
  it("rejects duplicate (user_id, topic_id, week_bucket)", async () => {
    if (process.env.PHASE_1_DB_READY !== "1") {
      throw new Error(
        "MISSING — Plan 03 must create votes table with unique constraint " +
          "votes_user_topic_week_unique. Plan 05 must run migration. " +
          "Set PHASE_1_DB_READY=1 after that."
      );
    }
    const { db, votes } = await import("@/lib/db");
    const userId = "test-user-id-stub";
    const topicId = "00000000-0000-0000-0000-000000000001";
    const weekBucket = "2026-W17";
    await expect(
      (async () => {
        await db.insert(votes).values({ userId, topicId, weekBucket });
        await db.insert(votes).values({ userId, topicId, weekBucket });
      })()
    ).rejects.toThrow(/duplicate key|unique constraint|votes_user_topic_week_unique/i);
  });
});
