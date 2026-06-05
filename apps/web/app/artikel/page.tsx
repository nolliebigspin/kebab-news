import { db, publishedArticles } from "@kebab/db";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { desc, isNotNull } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PageHero } from "@/components/PageHero";
import { Card } from "@/components/ui/card";

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
    <section className="mx-auto max-w-5xl px-6 py-12">
      <PageHero title={t("page_title")} subtitle={t("page_subtitle")} />

      {articles_.length === 0 ? (
        <p className="text-ink-mute">{t("empty")}</p>
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
