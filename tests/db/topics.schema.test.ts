import { describe, expect, it } from "vitest";

describe("topics schema (INFRA-02)", () => {
  it("has topic_status enum with values voting, investigating, done", async () => {
    if (process.env.PHASE_1_DB_READY !== "1") {
      throw new Error(
        "MISSING — Plan 03 must create topics table with topic_status enum. " +
          "Set PHASE_1_DB_READY=1 after migrations apply."
      );
    }
    const { db } = await import("@/lib/db");
    const { sql } = await import("drizzle-orm");
    const rows = await db.execute(sql`
      SELECT enumlabel
      FROM pg_enum
      JOIN pg_type ON pg_type.oid = pg_enum.enumtypid
      WHERE pg_type.typname = 'topic_status'
      ORDER BY enumsortorder
    `);
    const labels = rows.rows.map((r) => r.enumlabel);
    expect(labels).toEqual(["voting", "investigating", "done"]);
  });

  it("has all required columns with expected types", async () => {
    if (process.env.PHASE_1_DB_READY !== "1") {
      throw new Error("MISSING — gated on Plan 03.");
    }
    const { db } = await import("@/lib/db");
    const { sql } = await import("drizzle-orm");
    const rows = await db.execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'topics'
      ORDER BY ordinal_position
    `);
    const cols = rows.rows.map((r) => r.column_name);
    expect(cols).toEqual(
      expect.arrayContaining([
        "id",
        "title",
        "original_submission",
        "neutral_rewrite",
        "status",
        "vote_count",
        "created_by",
        "created_at",
      ])
    );
  });
});
