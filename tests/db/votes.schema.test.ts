import { articles, db, outlets, stories, user, votes } from "@kebab/db";
import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { countVotes, recordVote } from "../../apps/web/lib/vote";

const TEST_OUTLET_SLUG = "__votes_test_outlet__";
const TEST_STORY_SLUG = "__votes_test_story__";
const TEST_USER_A = "__votes_test_user_a__";
const TEST_USER_B = "__votes_test_user_b__";

let outletId: string;
let storyId: string;

async function cleanup() {
  // Order matters: votes FK both stories and user. Delete votes first, then
  // the parents. Skip child-table deletes on the first run (before IDs exist).
  if (storyId) await db.delete(votes).where(eq(votes.storyId, storyId));
  if (outletId) await db.delete(articles).where(eq(articles.outletId, outletId));
  await db.delete(stories).where(eq(stories.slug, TEST_STORY_SLUG));
  await db.delete(outlets).where(eq(outlets.slug, TEST_OUTLET_SLUG));
  await db.delete(user).where(inArray(user.id, [TEST_USER_A, TEST_USER_B]));
}

beforeAll(async () => {
  await cleanup();

  await db.insert(user).values([
    { id: TEST_USER_A, name: "Voter A", email: `${TEST_USER_A}@votes.test` },
    { id: TEST_USER_B, name: "Voter B", email: `${TEST_USER_B}@votes.test` },
  ]);

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

describe("votes — recordVote / countVotes", () => {
  it("records a first vote and reflects it in the count", async () => {
    const result = await recordVote(storyId, TEST_USER_A);
    expect(result.kind).toBe("recorded");
    expect(await countVotes(storyId)).toBe(1);
  });

  it("dedups a second vote from the same user", async () => {
    const result = await recordVote(storyId, TEST_USER_A);
    expect(result.kind).toBe("duplicate");
    expect(await countVotes(storyId)).toBe(1);
  });

  it("counts a different user as a separate vote", async () => {
    const result = await recordVote(storyId, TEST_USER_B);
    expect(result.kind).toBe("recorded");
    expect(await countVotes(storyId)).toBe(2);
  });
});
