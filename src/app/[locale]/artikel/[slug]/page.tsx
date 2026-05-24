import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { eq, isNotNull, sql } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { AnnotatedText } from "@/components/AnnotatedText";
import { Link } from "@/i18n/routing";
import { type Annotation, AnnotationsSchema } from "@/lib/annotate";
import { articles, db, type OutletLean, outlets, publishedArticles, stories } from "@/lib/db";
import { leanI18nKey } from "@/lib/lean";

type SourceRow = {
  id: string;
  url: string;
  headline: string;
  headlineAnnotations: Annotation[];
  outletName: string;
  outletSlug: string;
  outletLean: OutletLean;
  publishedAt: Date;
};

async function loadArticle(slug: string) {
  const rows = await db
    .select()
    .from(publishedArticles)
    .where(eq(publishedArticles.slug, slug))
    .limit(1);
  if (rows.length === 0) return null;
  const article = rows[0];
  // Drafts never render publicly.
  if (!article.publishedAt) return null;

  const storyRows = await db.select().from(stories).where(eq(stories.id, article.storyId)).limit(1);
  if (storyRows.length === 0) return null;
  const story = storyRows[0];

  const sourceRows = await db
    .select({
      id: articles.id,
      url: articles.url,
      headline: articles.headline,
      headlineAnnotations: articles.headlineAnnotations,
      outletName: outlets.name,
      outletSlug: outlets.slug,
      outletLean: outlets.politicalLean,
      publishedAt: articles.publishedAt,
    })
    .from(articles)
    .innerJoin(outlets, sql`${outlets.id} = ${articles.outletId}`)
    .where(eq(articles.storyId, story.id));

  const parseAnnotations = (raw: unknown): Annotation[] => {
    const result = AnnotationsSchema.safeParse(raw ?? []);
    return result.success ? result.data : [];
  };

  const sources: SourceRow[] = sourceRows.map((r) => ({
    ...r,
    headlineAnnotations: parseAnnotations(r.headlineAnnotations),
  }));

  return { article, story, sources };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await loadArticle(slug);
  if (!data) return { title: "kebab.news" };
  return {
    title: `${data.article.neutralHeadline} — kebab.news`,
    // Don't leak the AI body into meta description; use a generic blurb.
    description: "KI-generierte neutrale Zusammenfassung. Quellen darunter sichtbar.",
  };
}

export async function generateStaticParams() {
  // Empty by design — these are rendered on-demand at request time.
  // We don't pre-render drafts; published_at gates visibility in loadArticle.
  const rows = await db
    .select({ slug: publishedArticles.slug })
    .from(publishedArticles)
    .where(isNotNull(publishedArticles.publishedAt));
  return rows.map((r) => ({ slug: r.slug }));
}

export default async function ArtikelDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const data = await loadArticle(slug);
  if (!data) notFound();

  const t = await getTranslations({ locale, namespace: "artikel" });
  const tRadar = await getTranslations({ locale, namespace: "radar" });
  const dateLocale = locale === "de" ? de : enUS;
  const { article, story, sources } = data;

  const paragraphs = article.neutralBody
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <article className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-8">
        <Link
          href="/artikel"
          className="font-mono text-[11px] text-ink-mute uppercase tracking-[0.12em] hover:text-brand"
        >
          ← {t("back_to_index")}
        </Link>
      </div>

      {/*
        CLAUDE.md §VI rule 7: this disclaimer is MANDATORY on every /artikel
        page. Removing it requires editing the rule first.
      */}
      <aside
        className="mb-8 rounded-md border border-line bg-bg-warm px-4 py-3 text-ink-soft text-sm"
        role="note"
      >
        <strong className="font-semibold">{t("disclaimer_title")}</strong> {t("disclaimer_body")}
      </aside>

      <header className="mb-10">
        <h1 className="font-display text-3xl leading-tight sm:text-4xl">
          {article.neutralHeadline}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-3 font-mono text-[11px] text-ink-mute uppercase tracking-[0.12em]">
          {article.publishedAt ? (
            <time dateTime={article.publishedAt.toISOString()}>
              {format(article.publishedAt, "d. MMM yyyy, HH:mm", { locale: dateLocale })}
            </time>
          ) : null}
          <span>·</span>
          <span>{t("source_count", { count: article.sourceCount })}</span>
          <span>·</span>
          <span title={`${article.model} / ${article.promptVersion}`}>{article.model}</span>
        </div>
      </header>

      <div className="space-y-6 text-base text-ink leading-relaxed">
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      <section className="mt-16 border-line-soft border-t pt-8">
        <h2 className="mb-2 font-display text-xl">{t("sources_heading")}</h2>
        <p className="mb-6 text-ink-soft text-sm">{t("sources_subheading")}</p>
        <ul className="space-y-6">
          {sources.map((s) => (
            <li key={s.id} className="border-line-soft border-l-2 pl-4">
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="group block">
                <h3 className="font-display text-lg leading-snug group-hover:text-brand">
                  <AnnotatedText text={s.headline} annotations={s.headlineAnnotations} />
                </h3>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-ink-mute text-xs">
                  <span className="font-medium">{s.outletName}</span>
                  <span>·</span>
                  <span>{tRadar(`lean.${leanI18nKey(s.outletLean)}`)}</span>
                  <span>·</span>
                  <time dateTime={s.publishedAt.toISOString()}>
                    {format(s.publishedAt, "d. MMM yyyy", { locale: dateLocale })}
                  </time>
                  <span>·</span>
                  <span className="text-brand group-hover:underline">
                    {tRadar("read_at_source")}
                  </span>
                </div>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-12">
        <Link
          href={`/radar/${story.slug}`}
          className="font-mono text-[11px] text-ink-mute uppercase tracking-[0.12em] hover:text-brand"
        >
          {t("see_on_radar")} →
        </Link>
      </div>
    </article>
  );
}
