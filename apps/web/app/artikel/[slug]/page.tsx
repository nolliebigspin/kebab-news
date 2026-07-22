import { AnnotationsSchema, BASE_URL, leanI18nKey } from "@kebab/core";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { FiAlertCircle, FiCheckCircle, FiExternalLink, FiHelpCircle } from "react-icons/fi";
import { AnnotatedText } from "@/components/AnnotatedText";
import { CommentsSection } from "@/components/CommentsSection";
import { FramingText } from "@/components/FramingText";
import { QualityRating } from "@/components/QualityRating";
import { ShareMenu } from "@/components/ShareMenu";
import { Badge } from "@/components/ui/badge";
import { listComments } from "@/lib/comments";
import { leanColor } from "@/lib/lean";
import { getSession } from "@/lib/session";
import { loadPublishedStory } from "@/lib/stories";
import { getSummaryRatingSnapshot } from "@/lib/summary-ratings";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await loadPublishedStory(slug);
  if (!data) return { title: "Story nicht gefunden — kebab.news" };
  const canonical = `${BASE_URL}/artikel/${slug}`;
  const description = data.shortSummary.slice(0, 155);
  return {
    title: `${data.summary.neutralHeadline} — kebab.news`,
    description,
    alternates: { canonical },
    openGraph: {
      type: "article",
      url: canonical,
      siteName: "kebab.news",
      title: data.summary.neutralHeadline,
      description,
      publishedTime: data.summary.publishedAt?.toISOString(),
      modifiedTime: data.summary.rewrittenAt.toISOString(),
      images: [{ url: `${canonical}/opengraph-image`, width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", title: data.summary.neutralHeadline, description },
  };
}

function SourceRefs({
  ids,
  sources,
}: {
  ids: string[];
  sources: Array<{ outletSlug: string; outletName: string }>;
}) {
  const names = [
    ...new Set(
      sources.filter((source) => ids.includes(source.outletSlug)).map((source) => source.outletName)
    ),
  ];
  return names.length > 0 ? (
    <span className="mt-2 block font-mono text-[10px] text-ink-mute uppercase tracking-[0.1em]">
      Belegt durch {names.join(", ")}
    </span>
  ) : null;
}

export default async function ArticleDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await loadPublishedStory(slug);
  if (!data) notFound();
  const session = await getSession();
  const [rating, comments, tRadar] = await Promise.all([
    getSummaryRatingSnapshot(data.summary.id, session?.user.id),
    listComments(data.summary.id),
    getTranslations("radar"),
  ]);
  const canonical = `${BASE_URL}/artikel/${slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: data.summary.neutralHeadline,
    description: data.shortSummary,
    datePublished: data.summary.publishedAt?.toISOString(),
    dateModified: data.summary.rewrittenAt.toISOString(),
    mainEntityOfPage: canonical,
    publisher: { "@type": "Organization", name: "kebab.news", url: BASE_URL },
    citation: data.sources.map((source) => source.url),
  };

  return (
    <article>
      <script type="application/ld+json">{JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>
      <header className="border-line-soft border-b bg-bg-warm/55">
        <div className="mx-auto max-w-5xl px-6 py-10 sm:py-14">
          <nav
            aria-label="Brotkrumen"
            className="font-mono text-[11px] text-ink-mute uppercase tracking-[0.12em]"
          >
            <Link href="/">Aktuell</Link>
            <span aria-hidden> / </span>
            <span>Story</span>
          </nav>
          <p className="mt-8 font-mono text-[11px] text-brand-ink uppercase tracking-[0.14em]">
            {data.summary.sourceCount} Quellen · Version {data.summary.version}
          </p>
          <h1 className="mt-3 max-w-4xl text-balance font-display text-4xl leading-[1.08] sm:text-5xl">
            {data.summary.neutralHeadline}
          </h1>
          <p className="mt-6 max-w-3xl text-ink-soft text-lg leading-8">{data.shortSummary}</p>
          <div className="mt-7 flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-[11px] text-ink-mute uppercase tracking-[0.1em]">
            <span>
              Erstellt{" "}
              <time dateTime={data.summary.rewrittenAt.toISOString()}>
                {format(data.summary.rewrittenAt, "d. MMM yyyy, HH:mm", { locale: de })}
              </time>
            </span>
            <span aria-hidden>·</span>
            <span>
              Zuletzt aktualisiert{" "}
              {format(data.story.lastSeenAt, "d. MMM yyyy, HH:mm", { locale: de })}
            </span>
            <span aria-hidden>·</span>
            <span>
              {data.summary.contentOrigin === "manual" ? "Redaktionell" : "Automatisch erstellt"}
            </span>
          </div>
          <div className="mt-7">
            <ShareMenu
              summaryId={data.summary.id}
              title={data.summary.neutralHeadline}
              sourceCount={data.summary.sourceCount}
              canonicalUrl={canonical}
            />
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl gap-12 px-6 py-10 lg:grid-cols-[minmax(0,1fr)_15rem]">
        <div className="min-w-0 space-y-14">
          <aside
            className="rounded-xl border border-warn/35 bg-warn-wash p-4 text-ink-soft text-sm"
            aria-label="Transparenzhinweis"
          >
            <strong className="text-ink">KI-generierte Zusammenfassung. Ungeprüft.</strong> Sie ist
            eine quellengebundene Einordnung, keine Garantie auf Neutralität oder Wahrheit.
            Unsicherheiten und Unterschiede werden separat ausgewiesen.
          </aside>

          <section aria-labelledby="summary-heading">
            <div className="mb-6 flex items-center justify-between gap-4">
              <h2 id="summary-heading" className="font-display text-2xl">
                Die Zusammenfassung
              </h2>
              {data.annotations.length > 0 && (
                <span className="rounded-full bg-brand-wash px-3 py-1 text-brand-ink text-xs">
                  Markierungen antippen
                </span>
              )}
            </div>
            <FramingText
              paragraphs={data.paragraphs}
              annotations={data.annotations}
              sources={data.sources.map((source) => ({
                id: source.outletSlug,
                name: source.outletName,
                headline: source.headline,
              }))}
            />
          </section>

          <section aria-labelledby="facts-heading">
            <div className="flex items-center gap-3">
              <FiCheckCircle className="text-brand" aria-hidden />
              <h2 id="facts-heading" className="font-display text-2xl">
                Was gesichert ist
              </h2>
            </div>
            {data.confirmedFacts.length > 0 ? (
              <ul className="mt-5 space-y-3">
                {data.confirmedFacts.map((fact) => (
                  <li key={fact.text} className="rounded-xl border border-line-soft p-4">
                    <p className="leading-6">{fact.text}</p>
                    <SourceRefs ids={fact.source_ids} sources={data.sources} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 rounded-xl bg-bg-warm p-4 text-ink-soft text-sm">
                Für diese ältere Zusammenfassung wurden bestätigte Fakten noch nicht separat
                strukturiert. Prüfe die Quellen unten.
              </p>
            )}
          </section>

          <section aria-labelledby="unclear-heading">
            <div className="flex items-center gap-3">
              <FiHelpCircle className="text-warn" aria-hidden />
              <h2 id="unclear-heading" className="font-display text-2xl">
                Was noch unklar ist
              </h2>
            </div>
            {data.uncertainties.length > 0 ? (
              <ul className="mt-5 space-y-3">
                {data.uncertainties.map((item) => (
                  <li
                    key={item.text}
                    className="rounded-xl border border-warn/25 bg-warn-wash/50 p-4"
                  >
                    <p>{item.text}</p>
                    <SourceRefs ids={item.source_ids} sources={data.sources} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-ink-soft text-sm">
                Aktuell sind keine offenen Punkte strukturiert ausgewiesen. Das bedeutet nicht, dass
                keine Unsicherheit besteht.
              </p>
            )}
          </section>

          <section aria-labelledby="differences-heading">
            <div className="flex items-center gap-3">
              <FiAlertCircle className="text-brand" aria-hidden />
              <h2 id="differences-heading" className="font-display text-2xl">
                Wo sich Quellen unterscheiden
              </h2>
            </div>
            {data.differences.length > 0 ? (
              <div className="mt-5 space-y-5">
                {data.differences.map((difference) => (
                  <article
                    key={difference.topic}
                    className="overflow-hidden rounded-xl border border-line"
                  >
                    <header className="bg-bg-warm p-4">
                      <h3 className="font-semibold">{difference.topic}</h3>
                      <p className="mt-1 text-ink-soft text-sm">{difference.explanation}</p>
                    </header>
                    <div className="grid gap-px bg-line-soft sm:grid-cols-2">
                      {difference.positions.map((position) => (
                        <div key={position.label} className="bg-bg p-4">
                          <p className="text-sm leading-6">{position.label}</p>
                          <SourceRefs ids={position.source_ids} sources={data.sources} />
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-ink-soft text-sm">
                Für diese Version wurden keine konkreten Widersprüche strukturiert erfasst.
                Unterschiedliche Schlagzeilen und Gewichtungen bleiben in den Quellen sichtbar.
              </p>
            )}
          </section>

          <section id="quellen" aria-labelledby="sources-heading">
            <h2 id="sources-heading" className="font-display text-2xl">
              Originalquellen <span className="text-ink-mute">{data.sources.length}</span>
            </h2>
            <p className="mt-2 text-ink-soft text-sm">
              Viele Quellen sind kein automatischer Qualitätsbeweis. Entscheidend ist, was eine
              Quelle tatsächlich belegt und ob sie Primärinformationen enthält.
            </p>
            <ol className="mt-6 space-y-4">
              {data.sources.map((source) => {
                const parsed = AnnotationsSchema.safeParse(
                  (source as { headlineAnnotations?: unknown }).headlineAnnotations ?? []
                );
                return (
                  <li key={source.id} className="rounded-xl border border-line-soft p-5">
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">
                          <span
                            className="dot mr-1.5"
                            style={{ background: leanColor(source.outletLean) }}
                            aria-hidden
                          />
                          {tRadar(`lean.${leanI18nKey(source.outletLean)}`)}
                        </Badge>
                        <span className="font-medium text-sm">{source.outletName}</span>
                        <span className="text-ink-mute text-xs">
                          {source.language.toUpperCase()}
                        </span>
                      </div>
                      <h3 className="mt-3 font-display text-lg leading-snug group-hover:text-brand-ink">
                        <AnnotatedText
                          text={source.headline}
                          annotations={parsed.success ? parsed.data : []}
                        />
                      </h3>
                      {(source.excerpt || source.teaser) && (
                        <blockquote className="mt-3 border-line border-l-2 pl-3 text-ink-soft text-sm leading-6">
                          „{(source.excerpt || source.teaser)?.slice(0, 280)}“
                        </blockquote>
                      )}
                      <div className="mt-3 flex flex-wrap gap-2 text-ink-mute text-xs">
                        {source.author && <span>{source.author}</span>}
                        <time dateTime={source.publishedAt.toISOString()}>
                          {format(source.publishedAt, "d. MMM yyyy, HH:mm", { locale: de })}
                        </time>
                        <span className="ml-auto inline-flex items-center gap-1 text-brand-ink">
                          Original öffnen <FiExternalLink aria-hidden />
                        </span>
                      </div>
                    </a>
                  </li>
                );
              })}
            </ol>
          </section>

          {data.history.some((version) => version.changeSummary || version.correctionNote) && (
            <section aria-labelledby="history-heading">
              <h2 id="history-heading" className="font-display text-2xl">
                Änderungen & Korrekturen
              </h2>
              <ol className="mt-5 border-line border-l pl-5">
                {data.history
                  .filter((version) => version.changeSummary || version.correctionNote)
                  .map((version) => (
                    <li key={version.id} className="mb-5">
                      <p className="font-mono text-[11px] text-ink-mute uppercase">
                        Version {version.version} ·{" "}
                        {format(version.rewrittenAt, "d. MMM yyyy, HH:mm", { locale: de })}
                      </p>
                      <p className="mt-1 text-sm">
                        {version.correctionNote || version.changeSummary}
                      </p>
                    </li>
                  ))}
              </ol>
            </section>
          )}

          <QualityRating
            summaryId={data.summary.id}
            initial={rating}
            isAuthenticated={Boolean(session)}
          />
          <CommentsSection
            summaryId={data.summary.id}
            currentUserId={session?.user.id}
            comments={comments.map((comment) => ({
              ...comment,
              createdAt: comment.createdAt.toISOString(),
              updatedAt: comment.updatedAt.toISOString(),
            }))}
          />
        </div>

        <aside className="hidden lg:block">
          <nav
            aria-label="Auf dieser Seite"
            className="sticky top-6 rounded-xl border border-line-soft p-4 text-sm"
          >
            <p className="font-mono text-[10px] text-ink-mute uppercase tracking-[0.12em]">
              In dieser Story
            </p>
            <ul className="mt-3 space-y-2 text-ink-soft">
              <li>
                <a href="#summary-heading">Zusammenfassung</a>
              </li>
              <li>
                <a href="#facts-heading">Gesicherte Fakten</a>
              </li>
              <li>
                <a href="#unclear-heading">Offene Fragen</a>
              </li>
              <li>
                <a href="#differences-heading">Unterschiede</a>
              </li>
              <li>
                <a href="#quellen">Quellen</a>
              </li>
            </ul>
            <Link
              href="/methodik"
              className="mt-5 block border-line-soft border-t pt-4 text-brand-ink"
            >
              So arbeiten wir →
            </Link>
          </nav>
        </aside>
      </div>
    </article>
  );
}
