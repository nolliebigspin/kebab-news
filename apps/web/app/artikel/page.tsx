import { db, publishedArticles } from "@kebab/db";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { and, desc, isNotNull, type SQL, sql } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
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
      slug: publishedArticles.slug,
      neutralHeadline: publishedArticles.neutralHeadline,
      sourceCount: publishedArticles.sourceCount,
      publishedAt: publishedArticles.publishedAt,
    })
    .from(publishedArticles)
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
    <section className="mx-auto max-w-5xl px-6 py-12">
      <PageHero title={t("page_title")} subtitle={t("page_subtitle")} />

      <ArticleFilters filters={filters} />

      {articles_.length === 0 ? (
        <p className="text-ink-mute">{filters.q ? t("empty_search") : t("empty")}</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {articles_.map((article) => (
            <li key={article.slug}>
              <Card className="h-full gap-0 py-0 transition-shadow focus-within:ring-2 focus-within:ring-brand/40 hover:ring-foreground/20">
                <Link
                  href={`/artikel/${article.slug}`}
                  className="group flex h-full flex-col gap-3 rounded-xl p-5 outline-none"
                >
                  <h2 className="font-display text-lg leading-snug transition-colors group-hover:text-brand-ink group-focus-visible:text-brand-ink sm:text-xl">
                    {article.neutralHeadline}
                  </h2>
                  <div className="mt-auto flex flex-wrap items-center gap-2 font-mono text-[11px] text-ink-mute uppercase tracking-[0.12em]">
                    {article.publishedAt ? (
                      <time dateTime={article.publishedAt.toISOString()}>
                        {format(article.publishedAt, "d. MMM yyyy", { locale: de })}
                      </time>
                    ) : null}
                    <span aria-hidden>·</span>
                    <span>{t("source_count", { count: article.sourceCount })}</span>
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
