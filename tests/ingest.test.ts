import {
  articles,
  db,
  EMBEDDING_DIMENSIONS,
  type NewOutlet,
  outlets,
  publishedArticles,
  stories,
} from "@kebab/db";
import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const TEST_OUTLET_SLUG = "__ingest_test_outlet__";

// Mock the external-IO surface. rss-parser is a default-export class — we
// share one parseURL mock across all FakeParser instances so the test can
// configure it after the ingest module has already constructed its parser.
// vi.hoisted() is required because vi.mock is hoisted above top-level consts.
const { parseURLMock } = vi.hoisted(() => ({ parseURLMock: vi.fn() }));
vi.mock("rss-parser", () => {
  class FakeParser {
    parseURL = parseURLMock;
  }
  return { default: FakeParser };
});

// embedText + annotateText live in @kebab/core. Override only those two; keep
// the real clustering/slug/constant exports so the ingest pipeline still runs.
const { embedTextMock, annotateTextMock } = vi.hoisted(() => ({
  embedTextMock: vi.fn(),
  annotateTextMock: vi.fn(),
}));
vi.mock("@kebab/core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@kebab/core")>();
  return { ...actual, embedText: embedTextMock, annotateText: annotateTextMock };
});

// Imported after the mocks so the ingest module picks up the mocked deps.
const { runIngest } = await import("../apps/worker/src/ingest");

function uniformVector(value: number): number[] {
  return Array.from({ length: EMBEDDING_DIMENSIONS }, () => value);
}

let outletId: string;
let savedOutlets: NewOutlet[] = [];

beforeEach(async () => {
  // Ingest iterates every outlet in the DB. To make this test isolated and
  // deterministic, snapshot the existing outlets (seeded data) out, run the
  // test against ONE outlet, then restore the originals in afterEach.
  savedOutlets = await db.select().from(outlets);
  // Order matters: published_articles → stories (RESTRICT), articles → outlets
  // (cascade). published_articles must go first or the stories delete blocks.
  await db.delete(publishedArticles);
  await db.delete(articles);
  await db.delete(stories);
  await db.delete(outlets);

  const inserted = await db
    .insert(outlets)
    .values({
      slug: TEST_OUTLET_SLUG,
      name: "Test Outlet",
      politicalLean: "center",
      feedUrl: "https://example.test/feed.xml",
      homepageUrl: "https://example.test/",
    })
    .returning({ id: outlets.id });
  outletId = inserted[0].id;

  // Ingest must NOT call annotateText anymore (annotation moved to the rewrite
  // trigger). Default the mock to []; the test asserts it's never called.
  annotateTextMock.mockResolvedValue([]);
});

afterEach(async () => {
  // Clear everything created in this test, then restore the snapshotted outlets.
  await db.delete(publishedArticles);
  await db.delete(articles);
  await db.delete(stories);
  await db.delete(outlets);
  if (savedOutlets.length > 0) {
    await db.insert(outlets).values(savedOutlets);
  }
  vi.clearAllMocks();
});

describe("runIngest", () => {
  it("ingests new articles, clusters them, and is idempotent on second run", async () => {
    // Two near-duplicate items (should cluster) + one unrelated item.
    const feedItems = [
      {
        link: "https://example.test/article-1",
        title: "Headline one",
        contentSnippet: "Teaser one",
        isoDate: "2026-05-19T08:00:00Z",
      },
      {
        link: "https://example.test/article-2",
        title: "Headline two (similar)",
        contentSnippet: "Teaser two",
        isoDate: "2026-05-19T08:05:00Z",
      },
      {
        link: "https://example.test/article-3",
        title: "Headline three",
        contentSnippet: null,
        isoDate: "2026-05-19T08:10:00Z",
      },
    ];

    // Per-call parseURL: every run returns the same items so we can verify
    // the second call is a no-op (idempotency).
    parseURLMock.mockResolvedValue({ items: feedItems });

    // Embeddings: article 1 & 2 are nearly-identical, article 3 is orthogonal.
    // Cosine sim threshold is 0.78; uniformVector(0.5) vs uniformVector(0.51)
    // is ~1.0, and uniformVector(0.5) vs an orthogonal vector is ~0.
    const orthogonal = Array.from({ length: EMBEDDING_DIMENSIONS }, (_, i) => (i === 0 ? 1 : 0));
    embedTextMock
      .mockResolvedValueOnce(uniformVector(0.5))
      .mockResolvedValueOnce(uniformVector(0.51))
      .mockResolvedValueOnce(orthogonal);

    const first = await runIngest();
    const ourResult = first.results.find((r) => r.slug === TEST_OUTLET_SLUG);
    expect(ourResult).toBeDefined();
    expect(ourResult?.error).toBeUndefined();

    // Three articles inserted, two stories created (articles 1+2 cluster).
    const insertedArticles = await db
      .select()
      .from(articles)
      .where(eq(articles.outletId, outletId));
    expect(insertedArticles).toHaveLength(3);
    for (const a of insertedArticles) {
      expect(a.embedding).not.toBeNull();
      expect(a.storyId).not.toBeNull();
      // Ingest no longer annotates — framing annotation is deferred to the
      // rewrite trigger, so annotations stay at the column default ([]).
      expect(a.headlineAnnotations).toEqual([]);
      expect(a.teaserAnnotations).toEqual([]);
    }
    expect(annotateTextMock).not.toHaveBeenCalled();

    const ourStoryIds = new Set(insertedArticles.map((a) => a.storyId));
    expect(ourStoryIds.size).toBe(2); // article 1+2 → one story, article 3 → another

    // Second run: same feed, should be a no-op.
    embedTextMock.mockClear();
    annotateTextMock.mockClear();

    const second = await runIngest();
    const ourSecond = second.results.find((r) => r.slug === TEST_OUTLET_SLUG);
    expect(ourSecond?.newArticles).toBe(0);

    // No embedding / annotation work on the idempotent run.
    expect(embedTextMock).not.toHaveBeenCalled();
    expect(annotateTextMock).not.toHaveBeenCalled();

    const stillThree = await db
      .select({ id: articles.id })
      .from(articles)
      .where(eq(articles.outletId, outletId));
    expect(stillThree).toHaveLength(3);
  });

  it("survives a feed parser failure without affecting other outlets", async () => {
    parseURLMock.mockRejectedValue(new Error("boom"));

    const result = await runIngest();
    const ourResult = result.results.find((r) => r.slug === TEST_OUTLET_SLUG);
    expect(ourResult?.error).toBe("boom");
  });
});
