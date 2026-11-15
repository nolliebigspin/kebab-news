import { type Annotation, RADAR_MIN_OUTLETS } from "@kebab/core";
import { articles, db, type OutletLean, outlets, publishedArticles, stories } from "@kebab/db";
import { and, desc, eq, isNull, or, type SQL, sql } from "drizzle-orm";
import { cache } from "react";
import { parseAnnotations } from "@/lib/annotations";
import type { RadarFilters } from "@/lib/radar-filters";

/**
 * Topics ("Themen") are source clusters: every original contribution about
 * one event. Only topics with at least RADAR_MIN_OUTLETS distinct outlets are
 * reader-visible.
 */

export type TopicCardData = {
  id: string;
  slug: string;
  label: string;
  articleCount: number;
  firstSeenAt: Date;
  lastSeenAt: Date;
  leans: OutletLean[];
  /** Slug of the published kebab.news article for this topic, if live. */
  publishedSlug: string | null;
};

export async function loadTopics(filters: RadarFilters, limit = 50): Promise<TopicCardData[]> {
  const where: SQL[] = [];
  if (filters.days !== null) {
    where.push(sql`${stories.firstSeenAt} >= now() - make_interval(days => ${filters.days})`);
  }
  if (filters.q) {
    const term = `%${filters.q}%`;
    where.push(
      sql`(${stories.label} ILIKE ${term} OR ${articles.headline} ILIKE ${term} OR ${articles.teaser} ILIKE ${term})`
    );
  }

  // Count DISTINCT outlets: one busy outlet posting five updates counts once.
  const having: SQL[] = [sql`count(DISTINCT ${articles.outletId}) >= ${RADAR_MIN_OUTLETS}`];
  if (filters.lean) {
    having.push(sql`bool_or(${outlets.politicalLean} = ${filters.lean}::outlet_lean)`);
  }

  const orderBy =
    filters.sort === "outlets"
      ? [desc(sql`count(DISTINCT ${articles.outletId})`), desc(stories.firstSeenAt)]
      : [desc(stories.firstSeenAt)];

  const rows = await db
    .select({
      id: stories.id,
      slug: stories.slug,
      label: stories.label,
      articleCount: stories.articleCount,
      firstSeenAt: stories.firstSeenAt,
      lastSeenAt: stories.lastSeenAt,
      leans: sql<OutletLean[]>`array_agg(DISTINCT ${outlets.politicalLean})::text[]`,
      publishedSlug: sql<
        string | null
      >`case when ${publishedArticles.publishedAt} is not null then ${stories.slug} else null end`,
    })
    .from(stories)
    .innerJoin(articles, eq(articles.storyId, stories.id))
    .innerJoin(outlets, eq(outlets.id, articles.outletId))
    .leftJoin(publishedArticles, eq(publishedArticles.id, stories.publishedArticleId))
    .where(where.length > 0 ? and(...where) : undefined)
    .groupBy(stories.id, publishedArticles.id)
    .having(and(...having))
    .orderBy(...orderBy)
    .limit(limit);

  return rows.map((row) => ({ ...row, leans: row.leans ?? [] }));
}

export type TopicContribution = {
  id: string;
  url: string;
  headline: string;
  teaser: string | null;
  headlineAnnotations: Annotation[];
  teaserAnnotations: Annotation[];
  publishedAt: Date;
  outletName: string;
  outletSlug: string;
  outletLean: OutletLean;
};

/** One topic with every contribution and its published article, if live. */
export const loadTopic = cache(async (slug: string) => {
  const storyRows = await db.select().from(stories).where(eq(stories.slug, slug)).limit(1);
  const story = storyRows[0];
  if (!story) return null;

  const rows = await db
    .select({
      id: articles.id,
      url: articles.url,
      headline: articles.headline,
      teaser: articles.teaser,
      headlineAnnotations: articles.headlineAnnotations,
      teaserAnnotations: articles.teaserAnnotations,
      publishedAt: articles.publishedAt,
      outletName: outlets.name,
      outletSlug: outlets.slug,
      outletLean: outlets.politicalLean,
    })
    .from(articles)
    .innerJoin(outlets, eq(outlets.id, articles.outletId))
    .where(eq(articles.storyId, story.id))
    .orderBy(desc(articles.publishedAt));

  const contributions: TopicContribution[] = rows.map((row) => ({
    ...row,
    headlineAnnotations: parseAnnotations(row.headlineAnnotations),
    teaserAnnotations: parseAnnotations(row.teaserAnnotations),
  }));

  let published: { slug: string; headline: string } | null = null;
  if (story.publishedArticleId) {
    const pub = await db
      .select({
        headline: publishedArticles.neutralHeadline,
        publishedAt: publishedArticles.publishedAt,
      })
      .from(publishedArticles)
      .where(eq(publishedArticles.id, story.publishedArticleId))
      .limit(1);
    if (pub[0]?.publishedAt) published = { slug: story.slug, headline: pub[0].headline };
  }

  return { story, contributions, published };
});

/** Reader-visible topics without a live article, for the sitemap. */
export async function loadIndexableTopics(limit = 500) {
  return db
    .select({ slug: stories.slug, lastSeenAt: stories.lastSeenAt })
    .from(stories)
    .innerJoin(articles, eq(articles.storyId, stories.id))
    .leftJoin(publishedArticles, eq(publishedArticles.id, stories.publishedArticleId))
    .where(or(isNull(stories.publishedArticleId), isNull(publishedArticles.publishedAt)))
    .groupBy(stories.id)
    .having(sql`count(DISTINCT ${articles.outletId}) >= ${RADAR_MIN_OUTLETS}`)
    .orderBy(desc(stories.lastSeenAt))
    .limit(limit);
}
