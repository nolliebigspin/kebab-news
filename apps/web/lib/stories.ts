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
  outlets,
  publishedArticles,
  stories,
} from "@kebab/db";
import { desc, eq, isNotNull, sql } from "drizzle-orm";
import { z } from "zod";

const ParagraphsSchema = z.array(SummaryParagraphSchema);
const FactsSchema = z.array(ConfirmedFactSchema);
const UncertaintiesSchema = z.array(UncertaintySchema);
const DifferencesSchema = z.array(SourceDifferenceSchema);
const StoryAnnotationsSchema = z.array(StoryAnnotationSchema);

function parseOr<T>(schema: z.ZodType<T>, value: unknown, fallback: T): T {
  const parsed = schema.safeParse(value);
  return parsed.success ? parsed.data : fallback;
}

export async function loadPublishedStory(slug: string) {
  const rows = await db
    .select()
    .from(publishedArticles)
    .where(eq(publishedArticles.slug, slug))
    .limit(1);
  const summary = rows[0];
  if (!summary?.publishedAt) return null;

  const storyRows = await db.select().from(stories).where(eq(stories.id, summary.storyId)).limit(1);
  if (storyRows.length === 0) return null;

  const sourceRows = await db
    .select({
      id: articles.id,
      url: articles.url,
      headline: articles.headline,
      headlineAnnotations: articles.headlineAnnotations,
      teaser: articles.teaser,
      excerpt: articles.relevantExcerpt,
      language: articles.language,
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
    .where(eq(articles.storyId, summary.storyId))
    .orderBy(desc(articles.publishedAt));

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
    .where(eq(publishedArticles.storyId, summary.storyId))
    .orderBy(desc(publishedArticles.version), desc(publishedArticles.rewrittenAt));

  const shortFallback =
    usableParagraphs[0]?.text.slice(0, 360) ?? summary.neutralBody.slice(0, 360);
  return {
    summary,
    story: storyRows[0],
    sources: sourceRows,
    paragraphs: usableParagraphs,
    shortSummary: summary.shortSummary.trim() || shortFallback,
    confirmedFacts: parseOr(FactsSchema, summary.confirmedFacts, []),
    uncertainties: parseOr(UncertaintiesSchema, summary.uncertainties, []),
    differences: parseOr(DifferencesSchema, summary.sourceDifferences, []),
    annotations: parseOr(StoryAnnotationsSchema, summary.bodyAnnotations, []),
    history,
  };
}

export async function loadPublishedStoryCards(limit = 12) {
  return db
    .select({
      id: publishedArticles.id,
      slug: publishedArticles.slug,
      headline: publishedArticles.neutralHeadline,
      shortSummary: publishedArticles.shortSummary,
      body: publishedArticles.neutralBody,
      sourceCount: publishedArticles.sourceCount,
      updatedAt: publishedArticles.rewrittenAt,
      publishedAt: publishedArticles.publishedAt,
      status: publishedArticles.status,
    })
    .from(publishedArticles)
    .where(isNotNull(publishedArticles.publishedAt))
    .orderBy(desc(publishedArticles.publishedAt))
    .limit(limit);
}
