import { articles, db, outlets, publishedArticles, stories, user, votes } from "@kebab/db";
import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { findStoriesReadyForRewrite } from "../../apps/worker/src/rewrite";

const PREFIX = "__rewrite_eligibility__";
const OUTLET_SLUGS = [`${PREFIX}left`, `${PREFIX}center`, `${PREFIX}right`];
const STORY_SLUGS = [
  `${PREFIX}without_vote`,
  `${PREFIX}with_vote`,
  `${PREFIX}published_without_vote`,
];
const USER_ID = `${PREFIX}user`;

let storyIds: string[] = [];
let outletIds: string[] = [];

async function cleanup() {
  if (storyIds.length > 0) {
    await db.delete(votes).where(inArray(votes.storyId, storyIds));
    await db.delete(publishedArticles).where(inArray(publishedArticles.storyId, storyIds));
    await db.delete(articles).where(inArray(articles.storyId, storyIds));
  }
  await db.delete(stories).where(inArray(stories.slug, STORY_SLUGS));
  await db.delete(outlets).where(inArray(outlets.slug, OUTLET_SLUGS));
  await db.delete(user).where(eq(user.id, USER_ID));
}

beforeAll(async () => {
  await cleanup();

  await db.insert(user).values({
    id: USER_ID,
    name: "Rewrite eligibility voter",
    email: `${USER_ID}@test.invalid`,
  });

  const insertedOutlets = await db
    .insert(outlets)
    .values(
      OUTLET_SLUGS.map((slug, index) => ({
        slug,
        name: `Rewrite eligibility outlet ${index + 1}`,
        politicalLean: (["left", "center", "right"] as const)[index],
        feedUrl: `https://${slug}.test/feed`,
        homepageUrl: `https://${slug}.test`,
      }))
    )
    .returning({ id: outlets.id });
  outletIds = insertedOutlets.map((outlet) => outlet.id);

  const insertedStories = await db
    .insert(stories)
    .values(
      STORY_SLUGS.map((slug) => ({
        slug,
        label: slug,
        centroid: Array.from({ length: 512 }, () => 0),
        articleCount: outletIds.length,
      }))
    )
    .returning({ id: stories.id });
  storyIds = insertedStories.map((story) => story.id);

  await db.insert(articles).values(
    storyIds.flatMap((storyId, storyIndex) =>
      outletIds.map((outletId, outletIndex) => ({
        storyId,
        outletId,
        url: `https://rewrite-eligibility.test/${storyIndex}/${outletIndex}`,
        headline: `Rewrite eligibility ${storyIndex}/${outletIndex}`,
        publishedAt:
          storyIndex === 2 ? new Date("2026-07-26T12:00:00Z") : new Date("2026-07-27T12:00:00Z"),
      }))
    )
  );

  await db.insert(votes).values({ storyId: storyIds[1], userId: USER_ID });
  await db.insert(publishedArticles).values({
    storyId: storyIds[2],
    slug: `${PREFIX}published_article`,
    neutralHeadline: "Already published",
    neutralBody: "Already published body",
    sourceCount: outletIds.length,
    sourceOutletSlugs: OUTLET_SLUGS,
    model: "test",
    promptVersion: "test",
    status: "published",
    rewrittenAt: new Date("2026-07-27T00:00:00Z"),
    publishedAt: new Date("2026-07-27T00:00:00Z"),
  });
  await db.insert(articles).values(
    Array.from({ length: 4 }, (_, index) => ({
      storyId: storyIds[2],
      outletId: outletIds[index % outletIds.length],
      url: `https://rewrite-eligibility.test/published/new/${index}`,
      headline: `New source for published article ${index}`,
      publishedAt: new Date(`2026-07-27T0${index + 1}:00:00Z`),
    }))
  );
});

afterAll(cleanup);

describe("automatic article generation eligibility", () => {
  it("requires at least one topic upvote", async () => {
    const readyIds = new Set((await findStoriesReadyForRewrite()).map((story) => story.id));

    expect(readyIds.has(storyIds[0])).toBe(false);
    expect(readyIds.has(storyIds[1])).toBe(true);
  });

  it("requires a fresh upvote to update an existing article", async () => {
    const beforeVote = new Set((await findStoriesReadyForRewrite()).map((story) => story.id));

    expect(beforeVote.has(storyIds[2])).toBe(false);

    await db.insert(votes).values({
      storyId: storyIds[2],
      userId: USER_ID,
      createdAt: new Date("2026-07-27T05:00:00Z"),
    });
    const afterVote = new Set((await findStoriesReadyForRewrite()).map((story) => story.id));

    expect(afterVote.has(storyIds[2])).toBe(true);
  });
});
