import { db, publishedArticles, stories } from "@kebab/db";
import { inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { loadPublishedStoryCards } from "../../apps/web/lib/stories";

const STORY_SLUGS = ["__homepage_rewrite_old__", "__homepage_rewrite_new__"];
const ARTICLE_SLUGS = ["__homepage_article_old__", "__homepage_article_new__"];

async function cleanup() {
  await db
    .update(stories)
    .set({ publishedArticleId: null })
    .where(inArray(stories.slug, STORY_SLUGS));
  await db.delete(publishedArticles).where(inArray(publishedArticles.slug, ARTICLE_SLUGS));
  await db.delete(stories).where(inArray(stories.slug, STORY_SLUGS));
}

beforeAll(async () => {
  await cleanup();

  const insertedStories = await db
    .insert(stories)
    .values(
      STORY_SLUGS.map((slug) => ({
        slug,
        label: slug,
        centroid: Array.from({ length: 512 }, () => 0),
      }))
    )
    .returning({ id: stories.id, slug: stories.slug });
  const storyIds = new Map(insertedStories.map((story) => [story.slug, story.id]));

  const insertedArticles = await db
    .insert(publishedArticles)
    .values([
      {
        storyId: storyIds.get(STORY_SLUGS[0])!,
        slug: ARTICLE_SLUGS[0],
        neutralHeadline: "Older rewrite",
        neutralBody: "Older rewrite body",
        sourceCount: 3,
        sourceOutletSlugs: [],
        model: "test",
        promptVersion: "test",
        status: "published",
        rewrittenAt: new Date("2026-07-20T10:00:00Z"),
        publishedAt: new Date("2026-07-26T10:00:00Z"),
      },
      {
        storyId: storyIds.get(STORY_SLUGS[1])!,
        slug: ARTICLE_SLUGS[1],
        neutralHeadline: "Newer rewrite",
        neutralBody: "Newer rewrite body",
        sourceCount: 3,
        sourceOutletSlugs: [],
        model: "test",
        promptVersion: "test",
        status: "published",
        rewrittenAt: new Date("2026-07-21T10:00:00Z"),
        publishedAt: new Date("2026-07-25T10:00:00Z"),
      },
    ])
    .returning({ id: publishedArticles.id, storyId: publishedArticles.storyId });

  for (const article of insertedArticles) {
    await db
      .update(stories)
      .set({ publishedArticleId: article.id })
      .where(inArray(stories.id, [article.storyId]));
  }
});

afterAll(cleanup);

describe("homepage story cards", () => {
  it("shows newer rewrites before older rewrites regardless of publication backfill time", async () => {
    const cards = await loadPublishedStoryCards(1_000, "rewritten");
    const fixtureSlugs = cards
      .map((card) => card.slug)
      .filter((slug) => STORY_SLUGS.includes(slug));

    expect(fixtureSlugs).toEqual([STORY_SLUGS[1], STORY_SLUGS[0]]);
  });

  it("keeps publication order for other consumers", async () => {
    const cards = await loadPublishedStoryCards(1_000);
    const fixtureSlugs = cards
      .map((card) => card.slug)
      .filter((slug) => STORY_SLUGS.includes(slug));

    expect(fixtureSlugs).toEqual([STORY_SLUGS[0], STORY_SLUGS[1]]);
  });
});
