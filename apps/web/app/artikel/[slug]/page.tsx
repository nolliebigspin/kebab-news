import { type Annotation, AnnotationsSchema, leanI18nKey } from "@kebab/core";
import { articles, db, type OutletLean, outlets, publishedArticles, stories } from "@kebab/db";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { eq, isNotNull, sql } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { FiAlertTriangle } from "react-icons/fi";
import { AnnotatedText } from "@/components/AnnotatedText";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { leanColor } from "@/lib/lean";

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
  params: Promise<{ slug: string }>;
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

export default async function ArticleDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await loadArticle(slug);
  if (!data) notFound();

  const t = await getTranslations("articles");
  const tRadar = await getTranslations("radar");
  const { article, story, sources } = data;

  const paragraphs = article.neutralBody
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <article className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-8">
        <Link
          href="/"
          className="font-mono text-[11px] text-ink-mute uppercase tracking-[0.12em] hover:text-brand-ink"
        >
          ← {t("back_to_index")}
        </Link>
      </div>

      {/*
        CLAUDE.md §VI rule 7: this disclaimer is MANDATORY on every /artikel
        page. Removing it requires editing the rule first.
      */}
      <Alert className="mb-8 border-warn/40 bg-warn-wash [&>svg]:text-warn">
        <FiAlertTriangle aria-hidden />
        <AlertTitle>{t("disclaimer_title")}</AlertTitle>
        <AlertDescription className="text-ink-soft">{t("disclaimer_body")}</AlertDescription>
      </Alert>

      <header className="mb-10">
        <h1 className="font-display text-3xl leading-tight sm:text-4xl">
          {article.neutralHeadline}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-3 font-mono text-[11px] text-ink-mute uppercase tracking-[0.12em]">
          {article.publishedAt ? (
            <time dateTime={article.publishedAt.toISOString()}>
              {format(article.publishedAt, "d. MMM yyyy, HH:mm", { locale: de })}
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
                <h3 className="font-display text-lg leading-snug group-hover:text-brand-ink">
                  <AnnotatedText text={s.headline} annotations={s.headlineAnnotations} />
                </h3>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-ink-mute text-xs">
                  <Badge variant="outline" className="gap-1.5 text-ink-soft">
                    <span
                      className="dot"
                      style={{ background: leanColor(s.outletLean) }}
                      aria-hidden
                    />
                    {tRadar(`lean.${leanI18nKey(s.outletLean)}`)}
                  </Badge>
                  <span className="font-medium text-ink-soft">{s.outletName}</span>
                  <span aria-hidden>·</span>
                  <time dateTime={s.publishedAt.toISOString()}>
                    {format(s.publishedAt, "d. MMM yyyy", { locale: de })}
                  </time>
                  <span aria-hidden>·</span>
                  <span className="text-brand-ink group-hover:underline">
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
          className="font-mono text-[11px] text-ink-mute uppercase tracking-[0.12em] hover:text-brand-ink"
        >
          {t("see_on_radar")} →
        </Link>
      </div>
    </article>
  );
}
