import {
  ConfirmedFactSchema,
  LegacyStoryAnnotationSchema,
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
  outlets,
  publishedArticles,
  stories,
  summarySources,
} from "@kebab/db";
import { and, desc, eq, inArray, isNotNull, lte, or, sql } from "drizzle-orm";
import { z } from "zod";

const ParagraphsSchema = z.array(SummaryParagraphSchema);
const FactsSchema = z.array(ConfirmedFactSchema);
const UncertaintiesSchema = z.array(UncertaintySchema);
const DifferencesSchema = z.array(SourceDifferenceSchema);
const StoryAnnotationsSchema = z.array(StoryAnnotationSchema);
const LegacyStoryAnnotationsSchema = z.array(LegacyStoryAnnotationSchema);

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
  const current = StoryAnnotationsSchema.safeParse(value);
  if (current.success) return current.data;

  const legacy = LegacyStoryAnnotationsSchema.safeParse(value);
  if (!legacy.success) return [];
  return legacy.data.flatMap(({ evidence_source_ids: sourceIds, ...annotation }) => {
    const evidence = sourceIds.flatMap((sourceId) => {
      const source = sources.find(
        (candidate) => candidate.id === sourceId || candidate.outletSlug === sourceId
      );
      if (!source) return [];
      return [{ source_id: source.id, quote: source.teaser ?? source.headline }];
    });
    return evidence.length > 0 ? [{ ...annotation, evidence }] : [];
  });
}

export async function loadPublishedStory(slug: string) {
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
  const sourceRows =
    receiptIds.length > 0
      ? sourceCandidates
      : sourceCandidates.filter(
          (source, index, all) =>
            all.findIndex((candidate) => candidate.outletSlug === source.outletSlug) === index
        );

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
}

export async function loadPublishedStoryCards(limit = 12) {
  return db
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
    })
    .from(publishedArticles)
    .innerJoin(stories, eq(stories.publishedArticleId, publishedArticles.id))
    .where(isNotNull(publishedArticles.publishedAt))
    .orderBy(desc(publishedArticles.publishedAt))
    .limit(limit);
}
