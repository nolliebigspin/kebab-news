import { articles, db, outlets, publishedArticles, stories } from "@kebab/db";
import { inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { findStoriesReadyForRewrite } from "../../apps/worker/src/rewrite";

const PREFIX = "__rewrite_eligibility__";
const NOW = new Date("2026-07-27T12:00:00Z");
const OUTLET_SLUGS = [`${PREFIX}left`, `${PREFIX}center`, `${PREFIX}right`, `${PREFIX}public`];
const STORY_SLUGS = [
  `${PREFIX}current`,
  `${PREFIX}strongest_current`,
  `${PREFIX}published_update`,
  `${PREFIX}stale_strong`,
];

let storyIds: string[] = [];
let outletIds: string[] = [];

async function cleanup() {
  if (storyIds.length > 0) {
    await db.delete(publishedArticles).where(inArray(publishedArticles.storyId, storyIds));
    await db.delete(articles).where(inArray(articles.storyId, storyIds));
  }
  await db.delete(stories).where(inArray(stories.slug, STORY_SLUGS));
  await db.delete(outlets).where(inArray(outlets.slug, OUTLET_SLUGS));
}

beforeAll(async () => {
  await cleanup();

  const insertedOutlets = await db
    .insert(outlets)
    .values(
      OUTLET_SLUGS.map((slug, index) => ({
        slug,
        name: `Rewrite eligibility outlet ${index + 1}`,
        politicalLean: (["left", "center", "right", "public"] as const)[index],
        feedUrl: `https://${slug}.test/feed`,
        homepageUrl: `https://${slug}.test`,
      }))
    )
    .returning({ id: outlets.id });
  outletIds = insertedOutlets.map((outlet) => outlet.id);

  const lastSeenAt = [
    new Date("2026-07-27T11:00:00Z"),
    new Date("2026-07-27T10:00:00Z"),
    new Date("2026-07-27T09:00:00Z"),
    new Date("2026-07-20T12:00:00Z"),
  ];
  const sourceCounts = [3, 4, 3, 4];
  const insertedStories = await db
    .insert(stories)
    .values(
      STORY_SLUGS.map((slug, index) => ({
        slug,
        label: slug,
        centroid: Array.from({ length: 512 }, () => 0),
        articleCount: sourceCounts[index],
        firstSeenAt: lastSeenAt[index],
        lastSeenAt: lastSeenAt[index],
      }))
    )
    .returning({ id: stories.id });
  storyIds = insertedStories.map((story) => story.id);

  await db.insert(articles).values(
    storyIds.flatMap((storyId, storyIndex) =>
      outletIds.slice(0, sourceCounts[storyIndex]).map((outletId, outletIndex) => ({
        storyId,
        outletId,
        url: `https://rewrite-eligibility.test/${storyIndex}/${outletIndex}`,
        headline: `Rewrite eligibility ${storyIndex}/${outletIndex}`,
        fetchedAt: storyIndex === 2 ? new Date("2026-07-26T12:00:00Z") : lastSeenAt[storyIndex],
        publishedAt: storyIndex === 2 ? new Date("2026-07-26T12:00:00Z") : lastSeenAt[storyIndex],
      }))
    )
  );

  await db.insert(publishedArticles).values({
    storyId: storyIds[2],
    slug: `${PREFIX}published_article`,
    neutralHeadline: "Already published",
    neutralBody: "Already published body",
    sourceCount: 3,
    sourceOutletSlugs: OUTLET_SLUGS.slice(0, 3),
    model: "test",
    promptVersion: "test",
    status: "published",
    rewrittenAt: new Date("2026-07-27T00:00:00Z"),
    publishedAt: new Date("2026-07-27T00:00:00Z"),
  });
  await db.insert(articles).values(
    Array.from({ length: 4 }, (_, index) => ({
      storyId: storyIds[2],
      outletId: outletIds[index % 3],
      url: `https://rewrite-eligibility.test/published/new/${index}`,
      headline: `New source for published article ${index}`,
      fetchedAt: new Date(`2026-07-27T0${index + 1}:00:00Z`),
      // Publisher time predates the rewrite; eligibility follows when the
      // contribution was actually fetched and attached to the topic.
      publishedAt: new Date(`2026-07-26T0${index + 1}:00:00Z`),
    }))
  );
});

afterAll(cleanup);

describe("automatic article generation eligibility", () => {
  it("selects current topics without upvotes and ranks broader coverage first", async () => {
    const ready = await findStoriesReadyForRewrite({ now: NOW, storyIds });
    const readySlugs = ready.map((story) => story.slug);

    expect(readySlugs[0]).toBe(STORY_SLUGS[1]);
    expect(readySlugs).toContain(STORY_SLUGS[0]);
    expect(readySlugs).not.toContain(STORY_SLUGS[3]);
  });

  it("updates an existing article after enough new sources without another upvote", async () => {
    const readyIds = new Set(
      (await findStoriesReadyForRewrite({ now: NOW, storyIds })).map((story) => story.id)
    );

    expect(readyIds.has(storyIds[2])).toBe(true);
  });
});
