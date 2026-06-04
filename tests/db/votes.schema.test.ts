import { articles, db, outlets, stories, votes } from "@kebab/db";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { countVotesToday, recordVote, todayBucket } from "../../apps/web/lib/vote";

const TEST_OUTLET_SLUG = "__votes_test_outlet__";
const TEST_STORY_SLUG = "__votes_test_story__";

let outletId: string;
let storyId: string;

async function cleanup() {
  // Order matters: votes cascade from stories, articles cascade from outlets.
  // Skip child-table deletes on the first run (before IDs exist); the
  // parent delete via slug still runs and cascades children.
  if (storyId) await db.delete(votes).where(eq(votes.storyId, storyId));
  if (outletId) await db.delete(articles).where(eq(articles.outletId, outletId));
  await db.delete(stories).where(eq(stories.slug, TEST_STORY_SLUG));
  await db.delete(outlets).where(eq(outlets.slug, TEST_OUTLET_SLUG));
}

beforeAll(async () => {
  await cleanup();

  const insertedOutlet = await db
    .insert(outlets)
    .values({
      slug: TEST_OUTLET_SLUG,
      name: "Votes Test Outlet",
      politicalLean: "center",
      feedUrl: "https://votes.test/feed",
      homepageUrl: "https://votes.test/",
    })
    .returning({ id: outlets.id });
  outletId = insertedOutlet[0].id;

  // stories.centroid is NOT NULL — supply a 512-dim zero vector.
  const zeroCentroid = Array.from({ length: 512 }, () => 0);
  const insertedStory = await db
    .insert(stories)
    .values({
      slug: TEST_STORY_SLUG,
      label: "Votes Test Story",
      centroid: zeroCentroid,
      articleCount: 0,
    })
    .returning({ id: stories.id });
  storyId = insertedStory[0].id;
});

afterAll(cleanup);

describe("votes — recordVote / countVotesToday", () => {
  it("records a first vote and reflects it in the count", async () => {
    const result = await recordVote(storyId, "203.0.113.10");
    expect(result.kind).toBe("recorded");
    expect(await countVotesToday(storyId)).toBe(1);
  });

  it("dedups a second vote from the same IP on the same day", async () => {
    const result = await recordVote(storyId, "203.0.113.10");
    expect(result.kind).toBe("duplicate");
    expect(await countVotesToday(storyId)).toBe(1);
  });

  it("counts a different IP as a separate vote", async () => {
    const result = await recordVote(storyId, "198.51.100.5");
    expect(result.kind).toBe("recorded");
    expect(await countVotesToday(storyId)).toBe(2);
  });

  it("today's bucket matches today's date in UTC", () => {
    const expected = new Date().toISOString().slice(0, 10);
    expect(todayBucket()).toBe(expected);
  });
});
