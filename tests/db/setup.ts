import { afterEach, beforeAll } from "vitest";

const dbReady = process.env.PHASE_1_DB_READY === "1";

beforeAll(async () => {
  if (!dbReady) {
    return;
  }
});

afterEach(async () => {
  if (!dbReady) return;
  const { db } = await import("@/lib/db");
  const { sql } = await import("drizzle-orm");
  await db.execute(sql`TRUNCATE TABLE votes, topics, users CASCADE`);
});
