import { format } from "date-fns";
import { de } from "date-fns/locale";
import { desc, isNotNull } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { db, publishedArticles } from "@/lib/db";

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

async function loadPublished(): Promise<ArticleCard[]> {
  // Only live rewrites (published_at NOT NULL), newest first. Drafts never
  // surface here — same gate as the detail page.
  return db
    .select({
      slug: publishedArticles.slug,
      neutralHeadline: publishedArticles.neutralHeadline,
      sourceCount: publishedArticles.sourceCount,
      publishedAt: publishedArticles.publishedAt,
    })
    .from(publishedArticles)
    .where(isNotNull(publishedArticles.publishedAt))
    .orderBy(desc(publishedArticles.publishedAt))
    .limit(100);
}

export default async function ArticlesPage() {
  const t = await getTranslations("articles");
  const articles_ = await loadPublished();

  return (
    <section className="mx-auto max-w-3xl px-6 py-12">
      <header className="mb-10">
        <h1 className="font-display text-4xl leading-tight sm:text-5xl">{t("page_title")}</h1>
        <p className="mt-3 max-w-2xl text-base text-ink-soft leading-relaxed">
          {t("page_subtitle")}
        </p>
      </header>

      {articles_.length === 0 ? (
        <p className="text-ink-mute">{t("empty")}</p>
      ) : (
        <ul className="divide-y divide-line-soft border-line-soft border-y">
          {articles_.map((article) => (
            <li key={article.slug} className="py-6">
              <Link href={`/artikel/${article.slug}`} className="group block">
                <h2 className="font-display text-xl leading-snug transition-colors group-hover:text-brand sm:text-2xl">
                  {article.neutralHeadline}
                </h2>
                <div className="mt-3 flex flex-wrap items-center gap-3 font-mono text-[11px] text-ink-mute uppercase tracking-[0.12em]">
                  {article.publishedAt ? (
                    <time dateTime={article.publishedAt.toISOString()}>
                      {format(article.publishedAt, "d. MMM yyyy", { locale: de })}
                    </time>
                  ) : null}
                  <span>·</span>
                  <span>{t("source_count", { count: article.sourceCount })}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
