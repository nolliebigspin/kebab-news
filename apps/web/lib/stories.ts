import {
  ConfirmedFactSchema,
  SourceDifferenceSchema,
  StoryAnnotationSchema,
  SummaryParagraphSchema,
  UncertaintySchema,
} from "@kebab/core";
import {
  articleAuthors,
  articles,
  authors,
  db,
  type OutletLean,
  outlets,
  publishedArticles,
  stories,
  summarySources,
} from "@kebab/db";
import { and, desc, eq, inArray, isNotNull, lte, max, or, type SQL, sql } from "drizzle-orm";
import { cache } from "react";
import { z } from "zod";
import { parseAnnotations } from "@/lib/annotations";

const ParagraphsSchema = z.array(SummaryParagraphSchema);
const FactsSchema = z.array(ConfirmedFactSchema);
const UncertaintiesSchema = z.array(UncertaintySchema);
const DifferencesSchema = z.array(SourceDifferenceSchema);

function parseOr<T>(schema: z.ZodType<T>, value: unknown, fallback: T): T {
  const parsed = schema.safeParse(value);
  return parsed.success ? parsed.data : fallback;
}

function parseStoryAnnotations(
  value: unknown,
  sources: Array<{
    id: string;
    outletSlug: string;
    headline: string;
    teaser: string | null;
  }>
) {
  if (!Array.isArray(value)) return [];
  const knownSources = new Map(sources.map((source) => [source.id, source]));
  return value.flatMap((item) => {
    const parsed = StoryAnnotationSchema.safeParse(item);
    // Legacy source ids contain no evidence quote. Never manufacture a quote
    // by presenting an arbitrary teaser as the annotation's original evidence.
    if (!parsed.success) return [];
    const hasExactEvidence = parsed.data.evidence.every((evidence) => {
      const source = knownSources.get(evidence.source_id);
      return (
        source &&
        evidence.quote.trim() &&
        [source.headline, source.teaser].some((text) => text?.includes(evidence.quote))
      );
    });
    return hasExactEvidence ? [parsed.data] : [];
  });
}

/**
 * Full article payload. Wrapped in React `cache()` so `generateMetadata`, the
 * page and the OG image share one set of queries per request.
 */
export const loadPublishedStory = cache(async (slug: string) => {
  const rows = await db
    .select({ summary: publishedArticles, story: stories })
    .from(stories)
    .innerJoin(publishedArticles, eq(stories.publishedArticleId, publishedArticles.id))
    .where(or(eq(stories.slug, slug), eq(publishedArticles.slug, slug)))
    .limit(1);
  const summary = rows[0]?.summary;
  if (!summary?.publishedAt) return null;
  const story = rows[0].story;

  const receipts = await db
    .select({ articleId: summarySources.articleId })
    .from(summarySources)
    .where(eq(summarySources.summaryId, summary.id));
  const receiptIds = receipts.map((receipt) => receipt.articleId);
  const sourceWhere =
    receiptIds.length > 0
      ? inArray(articles.id, receiptIds)
      : and(
          eq(articles.storyId, summary.storyId),
          lte(articles.publishedAt, summary.rewrittenAt),
          summary.sourceOutletSlugs.length > 0
            ? inArray(outlets.slug, summary.sourceOutletSlugs)
            : undefined
        );

  const sourceCandidates = await db
    .select({
      id: articles.id,
      url: articles.url,
      headline: articles.headline,
      headlineAnnotations: articles.headlineAnnotations,
      teaser: articles.teaser,
      teaserAnnotations: articles.teaserAnnotations,
      language: articles.language,
      sourceKind: articles.sourceKind,
      publishedAt: articles.publishedAt,
      outletName: outlets.name,
      outletSlug: outlets.slug,
      outletLean: outlets.politicalLean,
      author: sql<string | null>`(
        select string_agg(${authors.name}, ', ' order by ${authors.name})
        from ${articleAuthors}
        inner join ${authors} on ${authors.id} = ${articleAuthors.authorId}
        where ${articleAuthors.articleId} = ${articles.id}
      )`,
    })
    .from(articles)
    .innerJoin(outlets, eq(outlets.id, articles.outletId))
    .where(sourceWhere)
    .orderBy(desc(articles.publishedAt));
  const sourceRows = (
    receiptIds.length > 0
      ? sourceCandidates
      : sourceCandidates.filter(
          (source, index, all) =>
            all.findIndex((candidate) => candidate.outletSlug === source.outletSlug) === index
        )
  ).map((source) => ({
    ...source,
    headlineAnnotations: parseAnnotations(source.headlineAnnotations),
    teaserAnnotations: parseAnnotations(source.teaserAnnotations),
  }));

  const legacyParagraphs = summary.neutralBody
    .split(/\n{2,}/)
    .map((text, index) => ({ id: `legacy-${index + 1}`, text: text.trim() }))
    .filter((paragraph) => paragraph.text.length > 0);
  const paragraphs = parseOr(ParagraphsSchema, summary.bodyParagraphs, legacyParagraphs);
  const usableParagraphs = paragraphs.length > 0 ? paragraphs : legacyParagraphs;

  const history = await db
    .select({
      id: publishedArticles.id,
      version: publishedArticles.version,
      status: publishedArticles.status,
      changeSummary: publishedArticles.changeSummary,
      correctionNote: publishedArticles.correctionNote,
      rewrittenAt: publishedArticles.rewrittenAt,
      publishedAt: publishedArticles.publishedAt,
    })
    .from(publishedArticles)
    .where(
      and(eq(publishedArticles.storyId, summary.storyId), isNotNull(publishedArticles.publishedAt))
    )
    .orderBy(desc(publishedArticles.version), desc(publishedArticles.rewrittenAt));

  const shortFallback =
    usableParagraphs[0]?.text.slice(0, 360) ?? summary.neutralBody.slice(0, 360);
  return {
    summary,
    story,
    sources: sourceRows,
    sourceReceiptMode: receiptIds.length > 0 ? ("exact" as const) : ("legacy_best_effort" as const),
    paragraphs: usableParagraphs,
    shortSummary: summary.shortSummary.trim() || shortFallback,
    confirmedFacts: parseOr(FactsSchema, summary.confirmedFacts, []),
    uncertainties: parseOr(UncertaintiesSchema, summary.uncertainties, []),
    differences: parseOr(DifferencesSchema, summary.sourceDifferences, []),
    annotations: parseStoryAnnotations(summary.bodyAnnotations, sourceRows),
    history,
  };
});

/**
 * Leans that fed a summary: exact receipts when present, otherwise every
 * contribution in the topic (legacy summaries predate receipts).
 */
const coveredLeans = sql<OutletLean[]>`coalesce(
  (select array_agg(distinct ${outlets.politicalLean})::text[]
     from ${summarySources}
     inner join ${articles} on ${articles.id} = ${summarySources.articleId}
     inner join ${outlets} on ${outlets.id} = ${articles.outletId}
    where ${summarySources.summaryId} = ${publishedArticles.id}),
  (select array_agg(distinct ${outlets.politicalLean})::text[]
     from ${articles}
     inner join ${outlets} on ${outlets.id} = ${articles.outletId}
    where ${articles.storyId} = ${stories.id}),
  '{}'::text[]
)`;

export type ArticleCardData = Awaited<ReturnType<typeof loadPublishedStoryCards>>[number];

export type ArticleListFilters = {
  q?: string;
  /** Lookback in days by publish date; `null` = all time. */
  days?: number | null;
  sort?: "recent" | "sources";
};

/**
 * Published articles for cards, lists, the feed, the sitemap and llms.txt.
 * Only live versions (`published_at NOT NULL`) ever surface.
 */
export async function loadPublishedStoryCards(
  limit = 12,
  sortBy: "published" | "rewritten" = "published",
  filters: ArticleListFilters = {}
) {
  const where: SQL[] = [isNotNull(publishedArticles.publishedAt)];
  if (filters.days) {
    where.push(
      sql`${publishedArticles.publishedAt} >= now() - make_interval(days => ${filters.days})`
    );
  }
  if (filters.q) {
    const term = `%${filters.q}%`;
    where.push(
      sql`(${publishedArticles.neutralHeadline} ILIKE ${term} OR ${publishedArticles.shortSummary} ILIKE ${term} OR ${publishedArticles.neutralBody} ILIKE ${term})`
    );
  }

  const timeOrder =
    sortBy === "rewritten"
      ? [desc(publishedArticles.rewrittenAt), desc(publishedArticles.publishedAt)]
      : [desc(publishedArticles.publishedAt), desc(publishedArticles.rewrittenAt)];
  const orderBy =
    filters.sort === "sources"
      ? [desc(publishedArticles.sourceCount), ...timeOrder]
      : [...timeOrder, desc(publishedArticles.id)];

  const rows = await db
    .select({
      id: publishedArticles.id,
      slug: stories.slug,
      headline: publishedArticles.neutralHeadline,
      shortSummary: publishedArticles.shortSummary,
      body: publishedArticles.neutralBody,
      sourceCount: publishedArticles.sourceCount,
      updatedAt: publishedArticles.rewrittenAt,
      publishedAt: publishedArticles.publishedAt,
      status: publishedArticles.status,
      leans: coveredLeans,
    })
    .from(publishedArticles)
    .innerJoin(stories, eq(stories.publishedArticleId, publishedArticles.id))
    .where(and(...where))
    .orderBy(...orderBy)
    .limit(limit);

  return rows.map((row) => ({
    ...row,
    leans: row.leans ?? [],
    summary: cardSummary(row.shortSummary, row.body),
  }));
}

/** Short summary, falling back to the first ~220 characters of the body. */
export function cardSummary(shortSummary: string, body: string): string {
  const short = shortSummary.trim();
  if (short) return short;
  return body.length > 220 ? `${body.slice(0, 220).trimEnd()}…` : body;
}

/** When the newest article went live, for the site-wide freshness signal. */
export const loadLatestPublishedAt = cache(async (): Promise<Date | null> => {
  const rows = await db
    .select({ latest: max(publishedArticles.rewrittenAt) })
    .from(publishedArticles)
    .where(isNotNull(publishedArticles.publishedAt));
  return rows[0]?.latest ?? null;
});

type SummaryOutlet = { name: string; lean: (typeof outlets.$inferSelect)["politicalLean"] };

/**
 * Distinct outlets (name + lean) behind each summary, for the homepage
 * skewers. Two queries for any number of summaries.
 */
export async function loadSummaryOutlets(
  summaryIds: string[]
): Promise<Map<string, SummaryOutlet[]>> {
  const result = new Map<string, SummaryOutlet[]>();
  if (summaryIds.length === 0) return result;
  const add = (rows: Array<SummaryOutlet & { summaryId: string }>) => {
    for (const { summaryId, ...outlet } of rows) {
      const list = result.get(summaryId) ?? [];
      list.push(outlet);
      result.set(summaryId, list);
    }
  };

  add(
    await db
      .selectDistinct({
        summaryId: summarySources.summaryId,
        name: outlets.name,
        lean: outlets.politicalLean,
      })
      .from(summarySources)
      .innerJoin(articles, eq(articles.id, summarySources.articleId))
      .innerJoin(outlets, eq(outlets.id, articles.outletId))
      .where(inArray(summarySources.summaryId, summaryIds))
  );

  // Legacy summaries predate receipts: fall back to the topic's contributions.
  const legacy = summaryIds.filter((id) => !result.has(id));
  if (legacy.length > 0) {
    add(
      await db
        .selectDistinct({
          summaryId: publishedArticles.id,
          name: outlets.name,
          lean: outlets.politicalLean,
        })
        .from(publishedArticles)
        .innerJoin(articles, eq(articles.storyId, publishedArticles.storyId))
        .innerJoin(outlets, eq(outlets.id, articles.outletId))
        .where(inArray(publishedArticles.id, legacy))
    );
  }
  return result;
}

/** Slugs and modification dates only: the sitemap needs nothing else. */
export async function loadPublishedSlugs(limit = 5000) {
  return db
    .select({ slug: stories.slug, updatedAt: publishedArticles.rewrittenAt })
    .from(publishedArticles)
    .innerJoin(stories, eq(stories.publishedArticleId, publishedArticles.id))
    .where(isNotNull(publishedArticles.publishedAt))
    .orderBy(desc(publishedArticles.rewrittenAt))
    .limit(limit);
}
