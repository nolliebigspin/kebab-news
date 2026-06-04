import { db, outlets } from "@kebab/db";
import { eq, or } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const TEST_SLUG = "__test_outlet_schema__";
const BOGUS_SLUG = "__bogus__";

async function cleanup() {
  await db.delete(outlets).where(or(eq(outlets.slug, TEST_SLUG), eq(outlets.slug, BOGUS_SLUG)));
}

beforeAll(cleanup);
afterAll(cleanup);

describe("outlets schema", () => {
  it("inserts and selects a row with each enum value accepted", async () => {
    const inserted = await db
      .insert(outlets)
      .values({
        slug: TEST_SLUG,
        name: "Test Outlet",
        politicalLean: "center",
        feedUrl: "https://example.com/feed",
        homepageUrl: "https://example.com",
      })
      .returning();

    expect(inserted).toHaveLength(1);
    expect(inserted[0].slug).toBe(TEST_SLUG);
    expect(inserted[0].politicalLean).toBe("center");
    expect(inserted[0].createdAt).toBeInstanceOf(Date);
  });

  it("enforces slug uniqueness", async () => {
    await expect(
      db.insert(outlets).values({
        slug: TEST_SLUG,
        name: "Duplicate",
        politicalLean: "left",
        feedUrl: "https://x.example/feed",
        homepageUrl: "https://x.example",
      })
    ).rejects.toThrow();
  });

  it("rejects an unknown political_lean value", async () => {
    await expect(
      db.execute(
        `INSERT INTO outlets (slug, name, political_lean, feed_url, homepage_url)
         VALUES ('__bogus__', 'B', 'sideways', 'https://b.example/feed', 'https://b.example')`
      )
    ).rejects.toThrow();
  });
});
