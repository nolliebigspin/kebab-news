import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  articles,
  db,
  EMBEDDING_DIMENSIONS,
  type NewOutlet,
  outlets,
  publishedArticles,
  stories,
} from "@/lib/db";

const TEST_OUTLET_SLUG = "__cron_test_outlet__";

// Mock the three external-IO modules. rss-parser is a default-export class —
// we share one parseURL mock across all FakeParser instances so the test can
// configure it after the route module has already constructed its parser.
// vi.hoisted() is required because vi.mock is hoisted above top-level consts.
const { parseURLMock } = vi.hoisted(() => ({ parseURLMock: vi.fn() }));
vi.mock("rss-parser", () => {
  class FakeParser {
    parseURL = parseURLMock;
  }
  return { default: FakeParser };
});

vi.mock("@/lib/embeddings", () => ({
  embedText: vi.fn(),
}));

vi.mock("@/lib/annotate", () => ({
  annotateText: vi.fn(),
}));

import { GET } from "@/app/api/cron/ingest/route";
// After mocking, importing the route module wires the mocks into the handler.
import { annotateText } from "@/lib/annotate";
import { embedText } from "@/lib/embeddings";

function uniformVector(value: number): number[] {
  return Array.from({ length: EMBEDDING_DIMENSIONS }, () => value);
}

function authedRequest(): Request {
  return new Request("http://localhost/api/cron/ingest", {
    headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
  });
}

let outletId: string;
let savedOutlets: NewOutlet[] = [];

beforeEach(async () => {
  // Cron iterates every outlet in the DB. To make this test isolated and
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

  vi.mocked(annotateText).mockResolvedValue([
    { start: 0, end: 8, type: "loaded-term", note: "Testbegriff" },
  ]);
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

describe("cron ingest route", () => {
  it("rejects requests without the CRON_SECRET", async () => {
    const response = await GET(
      new Request("http://localhost/api/cron/ingest", {
        headers: { authorization: "Bearer wrong" },
      })
    );
    expect(response.status).toBe(401);
  });

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
    vi.mocked(embedText)
      .mockResolvedValueOnce(uniformVector(0.5))
      .mockResolvedValueOnce(uniformVector(0.51))
      .mockResolvedValueOnce(orthogonal);

    const first = await GET(authedRequest());
    expect(first.status).toBe(200);
    const firstBody = (await first.json()) as {
      newArticles: number;
      newStories: number;
      results: Array<{ slug: string; error?: string }>;
    };

    // We only created one outlet for this test, but other outlets may exist
    // from prior seeding. Filter to our slug for assertions.
    const ourResult = firstBody.results.find((r) => r.slug === TEST_OUTLET_SLUG);
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
      expect(Array.isArray(a.headlineAnnotations)).toBe(true);
      expect((a.headlineAnnotations as unknown[]).length).toBeGreaterThan(0);
    }

    const ourStoryIds = new Set(insertedArticles.map((a) => a.storyId));
    expect(ourStoryIds.size).toBe(2); // article 1+2 → one story, article 3 → another

    // Second run: same feed, should be a no-op.
    vi.mocked(embedText).mockClear();
    vi.mocked(annotateText).mockClear();

    const second = await GET(authedRequest());
    const secondBody = (await second.json()) as {
      results: Array<{ slug: string; newArticles: number }>;
    };
    const ourSecond = secondBody.results.find((r) => r.slug === TEST_OUTLET_SLUG);
    expect(ourSecond?.newArticles).toBe(0);

    // No embedding / annotation work on the idempotent run.
    expect(vi.mocked(embedText)).not.toHaveBeenCalled();
    expect(vi.mocked(annotateText)).not.toHaveBeenCalled();

    const stillThree = await db
      .select({ id: articles.id })
      .from(articles)
      .where(eq(articles.outletId, outletId));
    expect(stillThree).toHaveLength(3);
  });

  it("survives a feed parser failure without affecting other outlets", async () => {
    parseURLMock.mockRejectedValue(new Error("boom"));

    const response = await GET(authedRequest());
    expect(response.status).toBe(200);
    const body = (await response.json()) as { results: Array<{ slug: string; error?: string }> };
    const ourResult = body.results.find((r) => r.slug === TEST_OUTLET_SLUG);
    expect(ourResult?.error).toBe("boom");
  });
});
