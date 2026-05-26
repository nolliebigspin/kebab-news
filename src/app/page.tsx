import { format } from "date-fns";
import { de } from "date-fns/locale";
import { desc, isNotNull } from "drizzle-orm";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { db, publishedArticles } from "@/lib/db";

async function loadPublished() {
  return db
    .select({
      id: publishedArticles.id,
      slug: publishedArticles.slug,
      neutralHeadline: publishedArticles.neutralHeadline,
      sourceCount: publishedArticles.sourceCount,
      publishedAt: publishedArticles.publishedAt,
    })
    .from(publishedArticles)
    .where(isNotNull(publishedArticles.publishedAt))
    .orderBy(desc(publishedArticles.publishedAt))
    .limit(50);
}

export default async function LandingPage() {
  const t = await getTranslations("articles");
  const items = await loadPublished();

  return (
    <section className="mx-auto max-w-5xl px-6 py-12">
      <header className="mb-10">
        <h1 className="font-display text-4xl leading-tight sm:text-5xl">{t("page_title")}</h1>
        <p className="mt-3 max-w-2xl text-base text-ink-soft leading-relaxed">
          {t("page_subtitle")}
        </p>
      </header>

      {items.length === 0 ? (
        <p className="text-ink-mute">{t("empty")}</p>
      ) : (
        <ul className="divide-y divide-line-soft border-line-soft border-y">
          {items.map((item) => (
            <li key={item.id} className="py-6">
              <Link href={`/articles/${item.slug}`} className="group block">
                <h2 className="font-display text-xl leading-snug transition-colors group-hover:text-brand sm:text-2xl">
                  {item.neutralHeadline}
                </h2>
                <div className="mt-3 flex flex-wrap items-center gap-4 font-mono text-[11px] text-ink-mute uppercase tracking-[0.12em]">
                  {item.publishedAt ? (
                    <time dateTime={item.publishedAt.toISOString()}>
                      {format(item.publishedAt, "d. MMM yyyy", { locale: de })}
                    </time>
                  ) : null}
                  <span>·</span>
                  <span>{t("source_count", { count: item.sourceCount })}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
