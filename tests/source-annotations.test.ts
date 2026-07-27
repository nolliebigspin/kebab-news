import { articles, db, EMBEDDING_DIMENSIONS, outlets, publishedArticles, stories } from "@kebab/db";
import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const { annotateTextsMock, completeAiUsageMock, failAiUsageReservationMock, reserveAiBudgetMock } =
  vi.hoisted(() => ({
    annotateTextsMock: vi.fn(),
    completeAiUsageMock: vi.fn(),
    failAiUsageReservationMock: vi.fn(),
    reserveAiBudgetMock: vi.fn().mockResolvedValue({ id: "reservation", maximumCostMicroUsd: 100 }),
  }));

vi.mock("@kebab/core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@kebab/core")>();
  return { ...actual, annotateTexts: annotateTextsMock };
});

vi.mock("../apps/worker/src/ai-budget", () => ({
  completeAiUsage: completeAiUsageMock,
  failAiUsageReservation: failAiUsageReservationMock,
  reserveAiBudget: reserveAiBudgetMock,
}));

const { annotateReadyStories } = await import("../apps/worker/src/rewrite");

const TEST_PREFIX = "__source_annotations_test__";
let outletIds: string[] = [];
let storyId = "";

async function cleanup() {
  if (storyId) {
    await db.delete(publishedArticles).where(eq(publishedArticles.storyId, storyId));
    await db.delete(articles).where(eq(articles.storyId, storyId));
    await db.delete(stories).where(eq(stories.id, storyId));
  }
  if (outletIds.length > 0) {
    await db.delete(outlets).where(inArray(outlets.id, outletIds));
  }
}

beforeAll(async () => {
  await cleanup();

  const insertedOutlets = await db
    .insert(outlets)
    .values(
      ["left", "center", "right"].map((lean, index) => ({
        slug: `${TEST_PREFIX}${index}`,
        name: `Source annotation test ${index}`,
        politicalLean: lean as "left" | "center" | "right",
        feedUrl: `https://example.test/${index}/feed`,
        homepageUrl: `https://example.test/${index}`,
      }))
    )
    .returning({ id: outlets.id });
  outletIds = insertedOutlets.map((row) => row.id);

  const insertedStories = await db
    .insert(stories)
    .values({
      slug: TEST_PREFIX,
      label: "EU verhängt Rekordstrafe gegen Google",
      centroid: Array.from({ length: EMBEDDING_DIMENSIONS }, () => 0),
      articleCount: 3,
    })
    .returning({ id: stories.id });
  storyId = insertedStories[0].id;

  await db.insert(articles).values(
    outletIds.map((outletId, index) => ({
      outletId,
      storyId,
      url: `https://example.test/article-${index}`,
      headline: `Quelle ${index}: EU verhängt Rekordstrafe gegen Google`,
      teaser: "Die Entscheidung stößt auf heftige Kritik.",
      publishedAt: new Date("2026-07-23T12:00:00Z"),
    }))
  );
});

afterAll(cleanup);

describe("annotateReadyStories", () => {
  it("annotates every source as soon as its story is reader-visible and only once per prompt version", async () => {
    reserveAiBudgetMock.mockResolvedValue({
      id: "reservation",
      maximumCostMicroUsd: 100,
    });
    annotateTextsMock.mockImplementation(async (inputs: Array<{ id: string; text: string }>) => {
      return {
        annotations: Object.fromEntries(
          inputs.map(({ id, text }) => {
            const quote = text.includes("Rekordstrafe") ? "Rekordstrafe" : "heftige Kritik";
            const start = text.indexOf(quote);
            return [
              id,
              [
                {
                  start,
                  end: start + quote.length,
                  quote,
                  type: "loaded-term",
                  note: "wertende Zuspitzung",
                },
              ],
            ];
          })
        ),
        usage: {
          provider: "google",
          model: "test",
          inputTokens: 100,
          outputTokens: 50,
          costMicroUsd: 30,
        },
      };
    });

    const first = await annotateReadyStories({ storyIds: [storyId] });
    expect(first).toEqual({ stories: 1, articles: 3 });
    expect(annotateTextsMock).toHaveBeenCalledOnce();
    expect(completeAiUsageMock).toHaveBeenCalledOnce();

    const rows = await db.select().from(articles).where(eq(articles.storyId, storyId));
    expect(rows).toHaveLength(3);
    for (const row of rows) {
      expect(row.annotationVersion).toBeTruthy();
      expect(row.headlineAnnotations).toEqual([expect.objectContaining({ quote: "Rekordstrafe" })]);
      expect(row.teaserAnnotations).toEqual([expect.objectContaining({ quote: "heftige Kritik" })]);
    }

    annotateTextsMock.mockClear();
    const second = await annotateReadyStories({ storyIds: [storyId] });
    expect(second).toEqual({ stories: 0, articles: 0 });
    expect(annotateTextsMock).not.toHaveBeenCalled();
  });

  it("preserves the last valid annotations when the AI request fails", async () => {
    const [row] = await db
      .select({ id: articles.id })
      .from(articles)
      .where(eq(articles.storyId, storyId))
      .limit(1);
    const previousAnnotation = {
      start: 13,
      end: 25,
      quote: "Rekordstrafe",
      type: "loaded-term" as const,
      note: "bestehende Analyse",
    };

    await db
      .update(articles)
      .set({
        headlineAnnotations: [previousAnnotation],
        annotationVersion: "previous-prompt-version",
      })
      .where(eq(articles.id, row.id));
    annotateTextsMock.mockReset().mockResolvedValue(null);

    const result = await annotateReadyStories({ storyIds: [storyId] });

    expect(result).toEqual({ stories: 1, articles: 0 });
    const [unchanged] = await db.select().from(articles).where(eq(articles.id, row.id));
    expect(unchanged.headlineAnnotations).toEqual([previousAnnotation]);
    expect(unchanged.annotationVersion).toBe("previous-prompt-version");
    expect(failAiUsageReservationMock).toHaveBeenCalled();
  });

  it("does not call the model after the daily budget is exhausted", async () => {
    const [row] = await db
      .select({ id: articles.id })
      .from(articles)
      .where(eq(articles.storyId, storyId))
      .limit(1);
    await db
      .update(articles)
      .set({ annotationVersion: "budget-test-previous-version" })
      .where(eq(articles.id, row.id));
    reserveAiBudgetMock.mockResolvedValueOnce(null);
    annotateTextsMock.mockClear();

    const result = await annotateReadyStories({ storyIds: [storyId] });

    expect(result).toEqual({ stories: 1, articles: 0 });
    expect(annotateTextsMock).not.toHaveBeenCalled();
    const [unchanged] = await db.select().from(articles).where(eq(articles.id, row.id));
    expect(unchanged.annotationVersion).toBe("budget-test-previous-version");
  });
});
