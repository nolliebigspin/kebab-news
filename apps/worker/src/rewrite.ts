/**
 * Shared rewrite logic, used by both the operator command
 * (`scripts/rewrite-run.ts`) and the worker's automatic vote-threshold
 * trigger (see `runAutoRewrites` below).
 *
 * Keeping it here means the auto-trigger and the manual command produce
 * identical drafts — same sources query, same Claude call, same persistence.
 */

import {
  generateRewrite,
  generateStorySlug,
  REWRITE_MODEL,
  REWRITE_PROMPT_VERSION,
  REWRITE_VOTE_THRESHOLD,
  type SourceItem,
} from "@kebab/core";
import { articles, db, outlets, publishedArticles, stories, votes } from "@kebab/db";
import { desc, eq, isNull, sql } from "drizzle-orm";

export type StoryRow = typeof stories.$inferSelect;

export async function loadSources(storyId: string): Promise<SourceItem[]> {
  return db
    .select({
      outletName: outlets.name,
      outletSlug: outlets.slug,
      lean: outlets.politicalLean,
      headline: articles.headline,
      teaser: articles.teaser,
      url: articles.url,
    })
    .from(articles)
    .innerJoin(outlets, eq(outlets.id, articles.outletId))
    .where(eq(articles.storyId, storyId));
}

export type RewriteOutcome =
  | { kind: "saved"; slug: string; headline: string }
  | { kind: "no-sources" }
  | { kind: "generation-failed" };

/**
 * Generate + persist a DRAFT rewrite (published_at = NULL) for one story.
 * Never publishes — the operator still flips drafts live via
 * `rewrite:publish`. Returns a structured outcome instead of throwing so the
 * worker loop can log and move on.
 */
export async function rewriteStory(story: StoryRow): Promise<RewriteOutcome> {
  const sources = await loadSources(story.id);
  if (sources.length === 0) return { kind: "no-sources" };

  const rewrite = await generateRewrite(story.label, sources);
  if (!rewrite) return { kind: "generation-failed" };

  const draftSlug = generateStorySlug(rewrite.neutral_headline);
  const sourceOutletSlugs = [...new Set(sources.map((s) => s.outletSlug))].sort();

  await db.insert(publishedArticles).values({
    storyId: story.id,
    slug: draftSlug,
    neutralHeadline: rewrite.neutral_headline,
    neutralBody: rewrite.neutral_body,
    sourceCount: sources.length,
    sourceOutletSlugs,
    model: REWRITE_MODEL,
    promptVersion: REWRITE_PROMPT_VERSION,
    // publishedAt left NULL — this is a draft. Operator publishes manually.
  });

  return { kind: "saved", slug: draftSlug, headline: rewrite.neutral_headline };
}

/**
 * Stories that have crossed the cumulative vote threshold and do NOT yet have
 * any rewrite (draft or published). The LEFT JOIN + isNull filter is how we
 * say "no published_articles row exists for this story".
 */
export async function findStoriesReadyForRewrite(): Promise<StoryRow[]> {
  const rows = await db
    .select({ story: stories })
    .from(stories)
    .innerJoin(votes, eq(votes.storyId, stories.id))
    .leftJoin(publishedArticles, eq(publishedArticles.storyId, stories.id))
    .where(isNull(publishedArticles.id))
    .groupBy(stories.id)
    .having(sql`count(${votes.id}) >= ${REWRITE_VOTE_THRESHOLD}`)
    .orderBy(desc(stories.lastSeenAt));
  return rows.map((r) => r.story);
}

export type AutoRewriteResult = { triggered: number; saved: number; failed: number };

/**
 * Worker hook: rewrite every story that has earned it. Called once per ingest
 * pass. AI calls stay in the worker process (CLAUDE.md rule #5) — the web app
 * only records the votes that make a story eligible.
 */
export async function runAutoRewrites(
  log: (event: string, fields?: Record<string, unknown>) => void = () => {}
): Promise<AutoRewriteResult> {
  const ready = await findStoriesReadyForRewrite();
  const result: AutoRewriteResult = { triggered: ready.length, saved: 0, failed: 0 };

  for (const story of ready) {
    log("worker.auto_rewrite_start", { storySlug: story.slug, label: story.label });
    const outcome = await rewriteStory(story);
    if (outcome.kind === "saved") {
      result.saved += 1;
      log("worker.auto_rewrite_saved", { storySlug: story.slug, draftSlug: outcome.slug });
    } else {
      result.failed += 1;
      log("worker.auto_rewrite_failed", { storySlug: story.slug, reason: outcome.kind });
    }
  }

  return result;
}
