import { db, publishedArticles, stories } from "@kebab/db";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { loadPublishedStory } from "../../apps/web/lib/stories";

const STORY_SLUG = "__public_story_visibility__";
const DRAFT_SLUG = "__public_story_draft__";
const LIVE_SLUG = "__public_story_live__";
let storyId: string;

async function cleanup() {
  await db.delete(publishedArticles).where(eq(publishedArticles.slug, DRAFT_SLUG));
  await db.delete(publishedArticles).where(eq(publishedArticles.slug, LIVE_SLUG));
  await db.delete(stories).where(eq(stories.slug, STORY_SLUG));
}

beforeAll(async () => {
  await cleanup();
  const story = await db
    .insert(stories)
    .values({
      slug: STORY_SLUG,
      label: "Visibility story",
      centroid: Array.from({ length: 512 }, () => 0),
    })
    .returning({ id: stories.id });
  storyId = story[0].id;
  await db.insert(publishedArticles).values([
    {
      storyId,
      slug: DRAFT_SLUG,
      neutralHeadline: "Draft",
      neutralBody: "Draft body",
      sourceCount: 0,
      sourceOutletSlugs: [],
      model: "test",
      promptVersion: "test",
      status: "needs_review",
    },
    {
      storyId,
      slug: LIVE_SLUG,
      neutralHeadline: "Live legacy summary",
      neutralBody: "First paragraph.\n\nSecond paragraph.",
      sourceCount: 0,
      sourceOutletSlugs: [],
      model: "test",
      promptVersion: "legacy",
      status: "published",
      publishedAt: new Date(),
    },
  ]);
});

afterAll(cleanup);

describe("public story read model", () => {
  it("does not expose an unpublished draft", async () => {
    expect(await loadPublishedStory(DRAFT_SLUG)).toBeNull();
  });

  it("keeps a legacy published summary readable through paragraph fallbacks", async () => {
    const story = await loadPublishedStory(LIVE_SLUG);
    expect(story?.shortSummary).toBe("First paragraph.");
    expect(story?.paragraphs.map((paragraph) => paragraph.text)).toEqual([
      "First paragraph.",
      "Second paragraph.",
    ]);
  });
});
