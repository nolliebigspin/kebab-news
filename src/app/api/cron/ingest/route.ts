import { eq, gt } from "drizzle-orm";
import { NextResponse } from "next/server";
import Parser from "rss-parser";

import { annotateText } from "@/lib/annotate";
import { assignStory, type ClusterCandidate } from "@/lib/cluster";
import { articles, db, type Outlet, outlets, stories } from "@/lib/db";
import { embedText } from "@/lib/embeddings";
import { env } from "@/lib/env";
import { generateStorySlug } from "@/lib/slug";

const STORY_WINDOW_HOURS = 72;
const PER_OUTLET_LIMIT = 30; // newest N items per feed per run

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

/**
 * Structured logger. Every line is one JSON object so Vercel logs and
 * `bun dev` terminal output can both be grepped by `event` and `runId`.
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
 * Vercel Cron hits this every 30 min with a CRON_SECRET bearer token.
 * Manual runs use the same auth via `bun ingest:run`.
 */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return runIngest("cron");
}

async function runIngest(trigger: "cron") {
  const runId = `run_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const startedAt = Date.now();
  log(runId, "ingest.start", { trigger });

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
    trigger,
    outlets: allOutlets.length,
    newArticles: totalNewArticles,
    newStories: totalNewStories,
    errors: results.filter((r) => r.error).length,
    durationMs,
  });

  return NextResponse.json({
    runId,
    trigger,
    outlets: allOutlets.length,
    newArticles: totalNewArticles,
    newStories: totalNewStories,
    durationMs,
    results,
  });
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
  for (const item of feed.items.slice(0, PER_OUTLET_LIMIT)) {
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

  // ON CONFLICT (url) DO NOTHING, returning only newly inserted rows.
  const inserted = await db
    .insert(articles)
    .values(
      incoming.map((i) => ({
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
  });

  if (inserted.length === 0) {
    return { slug: outlet.slug, newArticles: 0, newStories: 0 };
  }

  let newStoriesCount = 0;

  for (const article of inserted) {
    const seed = article.teaser ? `${article.headline}\n\n${article.teaser}` : article.headline;

    const [embedding, headlineAnnotations, teaserAnnotations] = await Promise.all([
      embedText(seed),
      annotateText(article.headline),
      article.teaser ? annotateText(article.teaser) : Promise.resolve([]),
    ]);

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
        headlineSpans: headlineAnnotations.length,
        teaserSpans: teaserAnnotations.length,
      });
    } else {
      const slug = generateStorySlug(article.headline);
      const inserted_stories = await db
        .insert(stories)
        .values({
          slug,
          label: article.headline,
          centroid: embedding,
          articleCount: 1,
        })
        .returning({ id: stories.id });
      storyId = inserted_stories[0].id;
      newStoriesCount += 1;
      log(runId, "article.clustered", {
        slug: outlet.slug,
        articleId: article.id,
        storyId,
        action: "new",
        headlineSpans: headlineAnnotations.length,
        teaserSpans: teaserAnnotations.length,
      });
    }

    await db
      .update(articles)
      .set({
        embedding,
        headlineAnnotations,
        teaserAnnotations,
        storyId,
      })
      .where(eq(articles.id, article.id));
  }

  return { slug: outlet.slug, newArticles: inserted.length, newStories: newStoriesCount };
}
