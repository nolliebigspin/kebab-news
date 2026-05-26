import { format } from "date-fns";
import { de } from "date-fns/locale";
import { eq, sql } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { AnnotatedText } from "@/components/AnnotatedText";
import { VoteButton } from "@/components/VoteButton";
import { type Annotation, AnnotationsSchema } from "@/lib/annotate";
import { articles, db, type OutletLean, outlets, publishedArticles, stories } from "@/lib/db";
import { LEAN_ORDER, leanI18nKey } from "@/lib/lean";
import { countVotesToday } from "@/lib/vote";

type StoryArticle = {
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

async function loadStory(slug: string) {
  const storyRows = await db.select().from(stories).where(eq(stories.slug, slug)).limit(1);
  if (storyRows.length === 0) return null;
  const story = storyRows[0];

  const articleRows = await db
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
    .innerJoin(outlets, sql`${outlets.id} = ${articles.outletId}`)
    .where(eq(articles.storyId, story.id));

  const parseAnnotations = (raw: unknown): Annotation[] => {
    const result = AnnotationsSchema.safeParse(raw ?? []);
    return result.success ? result.data : [];
  };

  const items: StoryArticle[] = articleRows.map((r) => ({
    ...r,
    headlineAnnotations: parseAnnotations(r.headlineAnnotations),
    teaserAnnotations: parseAnnotations(r.teaserAnnotations),
  }));

  // Look up the live published rewrite (if any) so we can link to /articles.
  // We don't follow stories.publishedArticleId — that pointer can be stale
  // if a draft was deleted. Source of truth is publishedArticles.publishedAt.
  let published: { slug: string; neutralHeadline: string } | null = null;
  if (story.publishedArticleId) {
    const pubRows = await db
      .select({
        slug: publishedArticles.slug,
        neutralHeadline: publishedArticles.neutralHeadline,
        publishedAt: publishedArticles.publishedAt,
      })
      .from(publishedArticles)
      .where(eq(publishedArticles.id, story.publishedArticleId))
      .limit(1);
    if (pubRows.length > 0 && pubRows[0].publishedAt) {
      published = { slug: pubRows[0].slug, neutralHeadline: pubRows[0].neutralHeadline };
    }
  }

  return { story, items, published };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await loadStory(slug);
  if (!data) return { title: "kebab.news" };
  return { title: `${data.story.label} — kebab.news` };
}

export default async function StoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await loadStory(slug);
  if (!data) notFound();

  const t = await getTranslations("radar");
  const { story, items, published } = data;
  const voteCount = await countVotesToday(story.id);

  // Group articles by lean, in LEAN_ORDER. Filter empty leans into the
  // "blind spots" list.
  const byLean = new Map<OutletLean, StoryArticle[]>();
  for (const lean of LEAN_ORDER) byLean.set(lean, []);
  for (const a of items) byLean.get(a.outletLean)?.push(a);
  const blindSpots = LEAN_ORDER.filter((l) => (byLean.get(l)?.length ?? 0) === 0);

  return (
    <article className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-8">
        <Link
          href="/radar"
          className="font-mono text-[11px] text-ink-mute uppercase tracking-[0.12em] hover:text-brand"
        >
          ← {t("back_to_radar")}
        </Link>
      </div>

      <header className="mb-10">
        <h1 className="font-display text-3xl leading-tight sm:text-4xl">{story.label}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <p className="font-mono text-[11px] text-ink-mute uppercase tracking-[0.12em]">
            {t("article_count", { count: story.articleCount })}
          </p>
          <VoteButton storyId={story.id} initialCount={voteCount} />
        </div>

        {published ? (
          <Link
            href={`/articles/${published.slug}`}
            className="mt-6 block rounded-md border border-brand/40 bg-brand/5 px-4 py-3 transition-colors hover:bg-brand/10"
          >
            <div className="font-mono text-[11px] text-brand uppercase tracking-[0.12em]">
              {t("published_rewrite_label")}
            </div>
            <div className="mt-1 font-display text-base text-ink">
              {published.neutralHeadline} →
            </div>
          </Link>
        ) : null}
      </header>

      <div className="space-y-12">
        {LEAN_ORDER.map((lean) => {
          const group = byLean.get(lean) ?? [];
          if (group.length === 0) return null;
          return (
            <section key={lean}>
              <h2 className="mb-4 font-mono text-[11px] text-ink-mute uppercase tracking-[0.12em]">
                {t(`lean.${leanI18nKey(lean)}`)}
              </h2>
              <ul className="space-y-6">
                {group.map((article) => (
                  <li key={article.id} className="border-line-soft border-l-2 pl-4">
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block"
                    >
                      <h3 className="font-display text-lg leading-snug group-hover:text-brand sm:text-xl">
                        <AnnotatedText
                          text={article.headline}
                          annotations={article.headlineAnnotations}
                        />
                      </h3>
                      {article.teaser ? (
                        <p className="mt-2 text-base text-ink-soft leading-relaxed">
                          <AnnotatedText
                            text={article.teaser}
                            annotations={article.teaserAnnotations}
                          />
                        </p>
                      ) : null}
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-ink-mute text-xs">
                        <span className="font-medium">{article.outletName}</span>
                        <span>·</span>
                        <time dateTime={article.publishedAt.toISOString()}>
                          {format(article.publishedAt, "d. MMM yyyy, HH:mm", {
                            locale: de,
                          })}
                        </time>
                        <span>·</span>
                        <span className="text-brand group-hover:underline">
                          {t("read_at_source")}
                        </span>
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      {blindSpots.length > 0 ? (
        <aside className="mt-12 border-line-soft border-t pt-6">
          <h2 className="mb-3 font-mono text-[11px] text-ink-mute uppercase tracking-[0.12em]">
            {t("blind_spots_label")}
          </h2>
          <ul className="flex flex-wrap gap-2">
            {blindSpots.map((lean) => (
              <li
                key={lean}
                className="rounded-full border border-line bg-bg-warm px-3 py-1 text-ink-soft text-sm"
              >
                {t(`lean.${leanI18nKey(lean)}`)}
              </li>
            ))}
          </ul>
        </aside>
      ) : (
        <aside className="mt-12 border-line-soft border-t pt-6">
          <p className="text-ink-mute text-sm">{t("no_blind_spots")}</p>
        </aside>
      )}
    </article>
  );
}
