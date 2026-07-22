/**
 * Shared summary logic used by the operator command and the worker's
 * source-diversity trigger (see `runAutoRewrites` below).
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
import { articles, db, outlets, publishedArticles, stories, summarySources } from "@kebab/db";
import { desc, eq, sql } from "drizzle-orm";

export type StoryRow = typeof stories.$inferSelect;

export async function loadSources(storyId: string): Promise<SourceItem[]> {
  return db
    .select({
      id: articles.id,
      outletName: outlets.name,
      outletSlug: outlets.slug,
      lean: outlets.politicalLean,
      headline: articles.headline,
      teaser: articles.teaser,
      url: articles.url,
      sourceKind: articles.sourceKind,
    })
    .from(articles)
    .innerJoin(outlets, eq(outlets.id, articles.outletId))
    .where(eq(articles.storyId, storyId));
}

/**
 * Annotate framing language on a selected story's source headlines + teasers.
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

  const previousRows = story.publishedArticleId
    ? await db
        .select({
          headline: publishedArticles.neutralHeadline,
          shortSummary: publishedArticles.shortSummary,
          body: publishedArticles.neutralBody,
        })
        .from(publishedArticles)
        .where(eq(publishedArticles.id, story.publishedArticleId))
        .limit(1)
    : [];
  const previousSummary = previousRows[0] ?? null;

  // Annotate the sources now that this story was selected — framing markings are
  // only ever shown for stories that reach a rewrite (radar detail + the
  // "Quellen" section on /artikel/[slug]), so this is the first time we need
  // them. Deferred from ingest to keep token cost bounded.
  await annotateStory(story.id);

  const rewrite = await generateRewrite(story.label, sources, previousSummary);
  if (!rewrite) return { kind: "generation-failed" };

  const sourceOutletSlugs = [...new Set(sources.map((s) => s.outletSlug))].sort();
  const versions = await db
    .select({ latest: sql<number>`coalesce(max(${publishedArticles.version}), 0)::int` })
    .from(publishedArticles)
    .where(eq(publishedArticles.storyId, story.id));
  const version = (versions[0]?.latest ?? 0) + 1;
  const draftSlug = generateStorySlug(
    `${rewrite.neutral_headline}-${story.id.slice(0, 8)}-v${version}`
  );

  await db.transaction(async (tx) => {
    const inserted = await tx
      .insert(publishedArticles)
      .values({
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
        changeSummary: version > 1 ? rewrite.change_summary : null,
        sourceCount: sources.length,
        sourceOutletSlugs,
        model: REWRITE_MODEL,
        promptVersion: REWRITE_PROMPT_VERSION,
        version,
        status: "needs_review",
      })
      .returning({ id: publishedArticles.id });
    await tx
      .insert(summarySources)
      .values(sources.map((source) => ({ summaryId: inserted[0].id, articleId: source.id })));
  });

  return { kind: "saved", slug: draftSlug, headline: rewrite.neutral_headline };
}

/**
 * Source-diverse stories without a summary, plus published stories whose
 * cluster received newer sources. An existing draft suppresses duplicate work.
 */
export async function findStoriesReadyForRewrite(): Promise<StoryRow[]> {
  const rows = await db
    .select({ story: stories })
    .from(stories)
    .innerJoin(articles, eq(articles.storyId, stories.id))
    .leftJoin(publishedArticles, eq(publishedArticles.storyId, stories.id))
    .groupBy(stories.id)
    .having(
      sql`count(DISTINCT ${articles.outletId}) >= ${RADAR_MIN_OUTLETS}
        and (
          count(DISTINCT ${publishedArticles.id}) = 0
          or (
            ${stories.lastSeenAt} > max(${publishedArticles.rewrittenAt})
            and count(*) filter (where ${publishedArticles.publishedAt} is null) = 0
          )
        )`
    )
    .orderBy(desc(stories.lastSeenAt));
  return rows.map((r) => r.story);
}

export type AutoRewriteResult = { triggered: number; saved: number; failed: number };

/**
 * Worker hook: draft every source-diverse story. Called once per ingest pass.
 * AI calls stay in the worker process (CLAUDE.md rule #5).
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
