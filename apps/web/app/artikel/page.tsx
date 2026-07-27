import { db, publishedArticles, stories } from "@kebab/db";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { and, desc, eq, isNotNull, type SQL, sql } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { FiArrowRight, FiCalendar } from "react-icons/fi";
import { ArticleFilters } from "@/components/ArticleFilters";
import { PageHero } from "@/components/PageHero";
import { Card } from "@/components/ui/card";
import {
  type ArticleFilters as ArticleFilterState,
  parseArticleFilters,
} from "@/lib/article-filters";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("articles");
  return { title: `${t("page_title")} — kebab.news`, description: t("page_subtitle") };
}

type ArticleCard = {
  slug: string;
  neutralHeadline: string;
  sourceCount: number;
  publishedAt: Date | null;
};

async function loadPublished(filters: ArticleFilterState): Promise<ArticleCard[]> {
  // Only live rewrites (published_at NOT NULL). Drafts never surface here —
  // same gate as the detail page.
  const where: SQL[] = [isNotNull(publishedArticles.publishedAt)];
  if (filters.days !== null) {
    where.push(
      sql`${publishedArticles.publishedAt} >= now() - make_interval(days => ${filters.days})`
    );
  }
  if (filters.q) {
    const term = `%${filters.q}%`;
    where.push(
      sql`(${publishedArticles.neutralHeadline} ILIKE ${term} OR ${publishedArticles.neutralBody} ILIKE ${term})`
    );
  }

  const orderBy =
    filters.sort === "sources"
      ? [desc(publishedArticles.sourceCount), desc(publishedArticles.publishedAt)]
      : [desc(publishedArticles.publishedAt)];

  return db
    .select({
      slug: stories.slug,
      neutralHeadline: publishedArticles.neutralHeadline,
      sourceCount: publishedArticles.sourceCount,
      publishedAt: publishedArticles.publishedAt,
    })
    .from(publishedArticles)
    .innerJoin(stories, eq(stories.publishedArticleId, publishedArticles.id))
    .where(and(...where))
    .orderBy(...orderBy)
    .limit(100);
}

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslations("articles");
  const filters = parseArticleFilters(await searchParams);
  const articles_ = await loadPublished(filters);

  return (
    <section className="mx-auto max-w-6xl px-5 py-10 sm:px-6 sm:py-16">
      <PageHero title={t("page_title")} subtitle={t("page_subtitle")} />

      <ArticleFilters filters={filters} />

      {articles_.length === 0 ? (
        <p className="text-ink-mute">{filters.q ? t("empty_search") : t("empty")}</p>
      ) : (
        <ul className="grid gap-5 md:grid-cols-2">
          {articles_.map((article) => (
            <li key={article.slug}>
              <Card className="h-full gap-0 py-0 focus-within:border-brand/50 hover:-translate-y-0.5 hover:border-brand/35 hover:shadow-lg">
                <Link
                  href={`/artikel/${article.slug}`}
                  className="group flex h-full min-h-56 flex-col rounded-2xl p-5 outline-none focus-visible:ring-3 focus-visible:ring-brand/35 sm:p-6"
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-mono text-[10px] text-brand-ink uppercase tracking-[0.1em]">
                      Artikel
                    </span>
                    <span className="rounded-full bg-bg-warm px-2.5 py-1 text-ink-mute text-xs">
                      {t("source_count", { count: article.sourceCount })}
                    </span>
                  </div>
                  <h2 className="mt-5 text-balance font-display text-2xl leading-snug transition-colors group-hover:text-brand-ink group-focus-visible:text-brand-ink">
                    {article.neutralHeadline}
                  </h2>
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-4 border-line-soft border-t pt-5 text-ink-mute text-xs">
                    {article.publishedAt ? (
                      <span className="inline-flex items-center gap-2">
                        <FiCalendar aria-hidden />
                        <time dateTime={article.publishedAt.toISOString()}>
                          {format(article.publishedAt, "d. MMM yyyy", { locale: de })}
                        </time>
                      </span>
                    ) : null}
                    <span className="inline-flex items-center gap-2 font-semibold text-brand-ink">
                      Lesen <FiArrowRight aria-hidden />
                    </span>
                  </div>
                </Link>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
