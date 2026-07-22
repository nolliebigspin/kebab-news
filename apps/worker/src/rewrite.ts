/**
 * Shared rewrite logic, used by both the operator command
 * (`scripts/rewrite-run.ts`) and the worker's automatic vote-threshold
 * trigger (see `runAutoRewrites` below).
 *
 * Keeping it here means the auto-trigger and the manual command produce
 * identical drafts — same sources query, same Claude call, same persistence.
 */

import {
  annotateText,
  generateRewrite,
  generateStorySlug,
  RADAR_MIN_OUTLETS,
  REWRITE_MODEL,
  REWRITE_PROMPT_VERSION,
  type SourceItem,
} from "@kebab/core";
import { articles, db, outlets, publishedArticles, stories } from "@kebab/db";
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

/**
 * Annotate framing language on a winning story's source headlines + teasers.
 *
 * Framing annotation used to run on every article during ingest, which burned
 * a lot of Claude tokens on articles that never get shown with annotations.
 * It now runs here — once per story, only when the story has earned a rewrite
 * — so the cost is bounded to the handful of stories that actually surface.
 * Idempotent: re-running re-annotates (cheap relative to the rewrite itself).
 *
 * Never throws into the worker loop: annotateText already swallows AI errors
 * and returns []. A failure just leaves a source unannotated.
 */
export async function annotateStory(storyId: string): Promise<void> {
  const rows = await db
    .select({
      id: articles.id,
      headline: articles.headline,
      teaser: articles.teaser,
    })
    .from(articles)
    .where(eq(articles.storyId, storyId));

  for (const row of rows) {
    const [headlineAnnotations, teaserAnnotations] = await Promise.all([
      annotateText(row.headline),
      row.teaser ? annotateText(row.teaser) : Promise.resolve([]),
    ]);
    await db
      .update(articles)
      .set({ headlineAnnotations, teaserAnnotations })
      .where(eq(articles.id, row.id));
  }
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

  // Annotate the sources now that this story has won — framing markings are
  // only ever shown for stories that reach a rewrite (radar detail + the
  // "Quellen" section on /artikel/[slug]), so this is the first time we need
  // them. Deferred from ingest to keep token cost bounded.
  await annotateStory(story.id);

  const rewrite = await generateRewrite(story.label, sources);
  if (!rewrite) return { kind: "generation-failed" };

  const draftSlug = generateStorySlug(rewrite.neutral_headline);
  const sourceOutletSlugs = [...new Set(sources.map((s) => s.outletSlug))].sort();

  await db.insert(publishedArticles).values({
    storyId: story.id,
    slug: draftSlug,
    neutralHeadline: rewrite.neutral_headline,
    neutralBody: rewrite.neutral_body,
    shortSummary: rewrite.short_summary,
    bodyParagraphs: rewrite.body,
    confirmedFacts: rewrite.confirmed_facts,
    uncertainties: rewrite.uncertainties,
    sourceDifferences: rewrite.differences,
    bodyAnnotations: rewrite.annotations,
    sourceCount: sources.length,
    sourceOutletSlugs,
    model: REWRITE_MODEL,
    promptVersion: REWRITE_PROMPT_VERSION,
    status: "needs_review",
    // publishedAt left NULL — this is a draft. Operator publishes manually.
  });

  return { kind: "saved", slug: draftSlug, headline: rewrite.neutral_headline };
}

/**
 * Source-diverse stories that do not yet have a draft or published summary.
 * Selection is a system/editorial concern; reader quality ratings never decide
 * what gets covered.
 */
export async function findStoriesReadyForRewrite(): Promise<StoryRow[]> {
  const rows = await db
    .select({ story: stories })
    .from(stories)
    .innerJoin(articles, eq(articles.storyId, stories.id))
    .leftJoin(publishedArticles, eq(publishedArticles.storyId, stories.id))
    .where(isNull(publishedArticles.id))
    .groupBy(stories.id)
    .having(sql`count(DISTINCT ${articles.outletId}) >= ${RADAR_MIN_OUTLETS}`)
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
