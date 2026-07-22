import {
  assignStory,
  type ClusterCandidate,
  embedText,
  generateStorySlug,
  MAX_NEW_ARTICLES_PER_OUTLET,
  PER_OUTLET_FEED_SCAN,
  STORY_WINDOW_HOURS,
} from "@kebab/core";
import { articles, db, type Outlet, outlets, stories } from "@kebab/db";
import { eq, gt, inArray } from "drizzle-orm";
import Parser from "rss-parser";

const parser = new Parser({
  timeout: 20_000,
  headers: { "User-Agent": "kebab.news radar/1.0 (+https://kebab.news)" },
});

type OutletResult = {
  slug: string;
  newArticles: number;
  newStories: number;
  error?: string;
};

export type IngestResult = {
  runId: string;
  outlets: number;
  newArticles: number;
  newStories: number;
  durationMs: number;
  results: OutletResult[];
};

/**
 * Structured logger. Every line is one JSON object so Dokploy container logs
 * and the local terminal can both be grepped by `event` and `runId`.
 */
function log(runId: string, event: string, fields: Record<string, unknown> = {}) {
  console.log(
    JSON.stringify({
      ts: new Date().toISOString(),
      runId,
      event,
      ...fields,
    })
  );
}

/**
 * One full ingest pass: fetch every outlet's feed, dedup, insert new articles,
 * embed + annotate + cluster each. Pure DB work — the worker scheduler (or the
 * `ingest:once` script) is the trigger; there is no HTTP layer anymore.
 */
export async function runIngest(): Promise<IngestResult> {
  const runId = `run_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const startedAt = Date.now();
  log(runId, "ingest.start");

  const allOutlets = await db.select().from(outlets);
  log(runId, "ingest.outlets_loaded", { count: allOutlets.length });

  const results: OutletResult[] = [];
  let totalNewArticles = 0;
  let totalNewStories = 0;

  for (const outlet of allOutlets) {
    const outletStartedAt = Date.now();
    try {
      const r = await ingestOutlet(outlet, runId);
      totalNewArticles += r.newArticles;
      totalNewStories += r.newStories;
      results.push(r);
      log(runId, "outlet.done", {
        slug: outlet.slug,
        newArticles: r.newArticles,
        newStories: r.newStories,
        durationMs: Date.now() - outletStartedAt,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log(runId, "outlet.error", {
        slug: outlet.slug,
        error: message,
        durationMs: Date.now() - outletStartedAt,
      });
      results.push({
        slug: outlet.slug,
        newArticles: 0,
        newStories: 0,
        error: message,
      });
    }
  }

  const durationMs = Date.now() - startedAt;
  log(runId, "ingest.finish", {
    outlets: allOutlets.length,
    newArticles: totalNewArticles,
    newStories: totalNewStories,
    errors: results.filter((r) => r.error).length,
    durationMs,
  });

  return {
    runId,
    outlets: allOutlets.length,
    newArticles: totalNewArticles,
    newStories: totalNewStories,
    durationMs,
    results,
  };
}

async function ingestOutlet(outlet: Outlet, runId: string): Promise<OutletResult> {
  const feed = await parser.parseURL(outlet.feedUrl);
  log(runId, "outlet.feed_parsed", {
    slug: outlet.slug,
    feedItems: feed.items.length,
  });

  type IncomingItem = {
    url: string;
    headline: string;
    teaser: string | null;
    publishedAt: Date;
  };

  const incoming: IncomingItem[] = [];
  for (const item of feed.items.slice(0, PER_OUTLET_FEED_SCAN)) {
    if (!item.link || !item.title) continue;
    const publishedAt = item.isoDate
      ? new Date(item.isoDate)
      : item.pubDate
        ? new Date(item.pubDate)
        : new Date();
    if (Number.isNaN(publishedAt.getTime())) continue;
    incoming.push({
      url: item.link.trim(),
      headline: item.title.trim(),
      teaser: (item.contentSnippet ?? item.summary ?? null)?.trim() || null,
      publishedAt,
    });
  }

  if (incoming.length === 0) {
    return { slug: outlet.slug, newArticles: 0, newStories: 0 };
  }

  // Filter out URLs we already have, BEFORE applying the AI cap. This way the
  // cap counts new articles only — if 25 of the top 30 feed items are
  // already ingested, we still ingest the 5 that are actually new (not 0
  // because the cap got "spent" on dedup).
  const existingRows = await db
    .select({ url: articles.url })
    .from(articles)
    .where(
      inArray(
        articles.url,
        incoming.map((i) => i.url)
      )
    );
  const existingUrls = new Set(existingRows.map((r) => r.url));
  const fresh = incoming.filter((i) => !existingUrls.has(i.url));

  const skippedByCap = Math.max(0, fresh.length - MAX_NEW_ARTICLES_PER_OUTLET);
  const toInsert = fresh.slice(0, MAX_NEW_ARTICLES_PER_OUTLET);

  if (toInsert.length === 0) {
    log(runId, "outlet.articles_inserted", {
      slug: outlet.slug,
      candidates: incoming.length,
      newArticles: 0,
      skippedByCap,
    });
    return { slug: outlet.slug, newArticles: 0, newStories: 0 };
  }

  // ON CONFLICT (url) DO NOTHING is belt-and-suspenders against a race
  // between our dedup query and the insert (overlapping worker runs).
  // Returning still gives us only newly inserted rows.
  const inserted = await db
    .insert(articles)
    .values(
      toInsert.map((i) => ({
        outletId: outlet.id,
        url: i.url,
        headline: i.headline,
        teaser: i.teaser,
        publishedAt: i.publishedAt,
      }))
    )
    .onConflictDoNothing({ target: articles.url })
    .returning({
      id: articles.id,
      headline: articles.headline,
      teaser: articles.teaser,
    });

  log(runId, "outlet.articles_inserted", {
    slug: outlet.slug,
    candidates: incoming.length,
    newArticles: inserted.length,
    skippedByCap,
  });

  if (inserted.length === 0) {
    return { slug: outlet.slug, newArticles: 0, newStories: 0 };
  }

  // Embed + cluster each new article. Framing annotation is deliberately NOT
  // done here — it's the expensive per-article Claude call, and only the
  // source-diverse stories selected for summaries are shown with annotations, so annotation
  // is deferred to the rewrite trigger (see runAutoRewrites / annotateStory).
  // Embedding (cheap Voyage call) + clustering (pure math) stay in ingest so
  // stories actually form.
  let newStoriesCount = 0;

  for (const article of inserted) {
    const seed = article.teaser ? `${article.headline}\n\n${article.teaser}` : article.headline;
    const embedding = await embedText(seed);

    // Load candidate stories within the window.
    const windowStart = new Date(Date.now() - STORY_WINDOW_HOURS * 3600 * 1000);
    const candidateRows = await db
      .select({
        storyId: stories.id,
        centroid: stories.centroid,
        articleCount: stories.articleCount,
      })
      .from(stories)
      .where(gt(stories.lastSeenAt, windowStart));

    const candidates: ClusterCandidate[] = candidateRows.map((r) => ({
      storyId: r.storyId,
      centroid: r.centroid,
      articleCount: r.articleCount,
    }));

    const assignment = assignStory({ embedding, candidates });

    let storyId: string;
    if (assignment.kind === "attach") {
      storyId = assignment.storyId;
      await db
        .update(stories)
        .set({
          centroid: assignment.newCentroid,
          articleCount: assignment.newCount,
          lastSeenAt: new Date(),
        })
        .where(eq(stories.id, storyId));
      log(runId, "article.clustered", {
        slug: outlet.slug,
        articleId: article.id,
        storyId,
        action: "attach",
      });
    } else {
      const slug = generateStorySlug(article.headline);
      const insertedStories = await db
        .insert(stories)
        .values({
          slug,
          label: article.headline,
          centroid: embedding,
          articleCount: 1,
        })
        .returning({ id: stories.id });
      storyId = insertedStories[0].id;
      newStoriesCount += 1;
      log(runId, "article.clustered", {
        slug: outlet.slug,
        articleId: article.id,
        storyId,
        action: "new",
      });
    }

    // Annotations stay at their column default ([]) until the rewrite trigger
    // fills them in for a winning story.
    await db.update(articles).set({ embedding, storyId }).where(eq(articles.id, article.id));
  }

  return { slug: outlet.slug, newArticles: inserted.length, newStories: newStoriesCount };
}
