import { articles, db, outlets, publishedArticles, stories, summarySources } from "@kebab/db";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { loadPublishedStory } from "../../apps/web/lib/stories";

const STORY_SLUG = "__public_story_visibility__";
const DRAFT_SLUG = "__public_story_draft__";
const LIVE_SLUG = "__public_story_live__";
let storyId: string;
let outletId: string;
let includedArticleId: string;

async function cleanup() {
  await db.delete(publishedArticles).where(eq(publishedArticles.slug, DRAFT_SLUG));
  await db.delete(publishedArticles).where(eq(publishedArticles.slug, LIVE_SLUG));
  if (storyId) await db.delete(articles).where(eq(articles.storyId, storyId));
  await db.delete(stories).where(eq(stories.slug, STORY_SLUG));
  await db.delete(outlets).where(eq(outlets.slug, "__public_story_outlet__"));
}

beforeAll(async () => {
  await cleanup();
  const outlet = await db
    .insert(outlets)
    .values({
      slug: "__public_story_outlet__",
      name: "Public story source",
      politicalLean: "center",
      feedUrl: "https://public-story.test/feed",
      homepageUrl: "https://public-story.test",
    })
    .returning({ id: outlets.id });
  outletId = outlet[0].id;
  const story = await db
    .insert(stories)
    .values({
      slug: STORY_SLUG,
      label: "Visibility story",
      centroid: Array.from({ length: 512 }, () => 0),
    })
    .returning({ id: stories.id });
  storyId = story[0].id;
  const sourceArticles = await db
    .insert(articles)
    .values([
      {
        outletId,
        storyId,
        url: "https://public-story.test/included",
        headline: "Used by this version",
        teaser: "A short attributed source excerpt.",
        publishedAt: new Date("2026-01-01T12:00:00Z"),
      },
      {
        outletId,
        storyId,
        url: "https://public-story.test/later",
        headline: "Attached after this version",
        publishedAt: new Date("2026-01-03T12:00:00Z"),
      },
    ])
    .returning({ id: articles.id });
  includedArticleId = sourceArticles[0].id;
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
      bodyParagraphs: [
        { id: "legacy-context", text: "First paragraph." },
        { id: "legacy-detail", text: "Second paragraph." },
      ],
      bodyAnnotations: [
        {
          paragraph_id: "legacy-context",
          quote: "First",
          category: "word-choice",
          title: "Legacy marker",
          explanation: "Legacy explanation",
          possible_effect: "Legacy effect",
          alternatives: [],
          evidence_source_ids: ["__public_story_outlet__"],
          confidence: "medium",
          origin: "automatic",
          review_status: "needs_review",
        },
      ],
      sourceCount: 0,
      sourceOutletSlugs: [],
      model: "test",
      promptVersion: "legacy",
      status: "published",
      rewrittenAt: new Date("2026-01-02T12:00:00Z"),
      publishedAt: new Date("2026-01-02T12:00:00Z"),
    },
  ]);
  const live = await db
    .select({ id: publishedArticles.id })
    .from(publishedArticles)
    .where(eq(publishedArticles.slug, LIVE_SLUG))
    .limit(1);
  await db.update(stories).set({ publishedArticleId: live[0].id }).where(eq(stories.id, storyId));
  await db.insert(summarySources).values({ summaryId: live[0].id, articleId: includedArticleId });
});

afterAll(cleanup);

describe("public story read model", () => {
  it("does not expose an unpublished draft", async () => {
    expect(await loadPublishedStory(DRAFT_SLUG)).toBeNull();
  });

  it("uses exact receipts and a time-bounded fallback for pre-receipt summaries", async () => {
    const story = await loadPublishedStory(LIVE_SLUG);
    expect((await loadPublishedStory(STORY_SLUG))?.summary.id).toBe(story?.summary.id);
    expect(story?.shortSummary).toBe("First paragraph.");
    expect(story?.paragraphs.map((paragraph) => paragraph.text)).toEqual([
      "First paragraph.",
      "Second paragraph.",
    ]);
    expect(story?.sources.map((source) => source.headline)).toEqual(["Used by this version"]);
    expect(story?.annotations[0]?.evidence).toEqual([
      {
        source_id: includedArticleId,
        quote: "A short attributed source excerpt.",
      },
    ]);

    const live = await db
      .select({ id: publishedArticles.id })
      .from(publishedArticles)
      .where(eq(publishedArticles.slug, LIVE_SLUG))
      .limit(1);
    await db.delete(summarySources).where(eq(summarySources.summaryId, live[0].id));
    await db
      .update(publishedArticles)
      .set({ sourceOutletSlugs: ["__public_story_outlet__"] })
      .where(eq(publishedArticles.id, live[0].id));

    const legacyFallback = await loadPublishedStory(LIVE_SLUG);
    expect(legacyFallback?.sources.map((source) => source.headline)).toEqual([
      "Used by this version",
    ]);
  });
});
