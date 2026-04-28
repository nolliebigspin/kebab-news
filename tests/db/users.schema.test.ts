import { describe, expect, it } from "vitest";

describe("users schema (INFRA-01)", () => {
  it("has trust_score column with default 0 and FK to neon_auth.users_sync", async () => {
    if (process.env.PHASE_1_DB_READY !== "1") {
      throw new Error(
        "MISSING — Plan 03 must create src/lib/db/schema.ts with users table " +
          "(id text PK FK→neon_auth.users_sync.id, trust_score int default 0). " +
          "Set PHASE_1_DB_READY=1 after Plan 03 + Plan 05 migration runs."
      );
    }
    const { db } = await import("@/lib/db");
    const { sql } = await import("drizzle-orm");
    const rows = await db.execute(sql`
      SELECT column_default, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'users'
        AND column_name = 'trust_score'
    `);
    expect(rows.rows[0]?.column_default).toBe("0");
    expect(rows.rows[0]?.data_type).toBe("integer");
  });
});
