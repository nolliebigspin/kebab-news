import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { FiCheck, FiChevronDown, FiHelpCircle } from "react-icons/fi";
import { CommentsSection } from "@/components/CommentsSection";
import { FramingText } from "@/components/FramingText";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Container } from "@/components/layout/Container";
import { SourceSkewer, SourceSpectrum } from "@/components/lean/SourceSpectrum";
import { QualityRating } from "@/components/QualityRating";
import { ShareMenu } from "@/components/ShareMenu";
import { JsonLd } from "@/components/seo/JsonLd";
import { SourceItem } from "@/components/sources/SourceItem";
import { Badge } from "@/components/ui/badge";
import { listComments } from "@/lib/comments";
import { formatDate } from "@/lib/format";
import { pageMetadata } from "@/lib/seo";
import { getSession } from "@/lib/session";
import { absoluteUrl } from "@/lib/site";
import { loadPublishedStory } from "@/lib/stories";
import { newsArticleSchema } from "@/lib/structured-data";
import { getSummaryRatingSnapshot } from "@/lib/summary-ratings";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await loadPublishedStory(slug);
  if (!data) return { title: "Artikel nicht gefunden", robots: { index: false } };
  const path = `/artikel/${data.story.slug}`;
  const description =
    data.shortSummary.length > 158
      ? `${data.shortSummary.slice(0, 155).trimEnd()}…`
      : data.shortSummary;
  return pageMetadata({
    title: data.summary.neutralHeadline,
    description,
    path,
    image: `${path}/opengraph-image`,
    openGraph: {
      type: "article",
      publishedTime: data.summary.publishedAt?.toISOString(),
      modifiedTime: data.summary.rewrittenAt.toISOString(),
      section: "Nachrichten",
      authors: [absoluteUrl("/ueber-uns")],
    },
  });
}

const SECTIONS = [
  { id: "zusammenfassung", label: "Zusammenfassung" },
  { id: "gesichert", label: "Was gesichert ist" },
  { id: "unklar", label: "Was unklar ist" },
  { id: "unterschiede", label: "Unterschiede" },
  { id: "quellen", label: "Quellen" },
] as const;

function SourceRefs({
  ids,
  sources,
}: {
  ids: string[];
  sources: Array<{ id: string; outletName: string; outletSlug: string }>;
}) {
  const names = [
    ...new Set(
      sources
        .filter((source) => ids.includes(source.id) || ids.includes(source.outletSlug))
        .map((source) => source.outletName)
    ),
  ];
  return names.length > 0 ? (
    <p className="mt-1.5 text-ink-mute text-sm">Belegt durch {names.join(", ")}</p>
  ) : null;
}

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="scroll-mt-24 font-display text-title">
      {children}
    </h2>
  );
}

export default async function ArticleDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await loadPublishedStory(slug);
  if (!data) notFound();
  if (slug !== data.story.slug) permanentRedirect(`/artikel/${data.story.slug}`);
  const session = await getSession();
  const [rating, comments] = await Promise.all([
    getSummaryRatingSnapshot(data.summary.id, session?.user.id),
    listComments(data.summary.id),
  ]);

  const path = `/artikel/${data.story.slug}`;
  const { summary } = data;
  const leans = data.sources.map((source) => source.outletLean);
  const correctionHistory = data.history.filter(
    (version) => version.changeSummary || version.correctionNote
  );

  return (
    <article>
      <JsonLd
        data={newsArticleSchema({
          path,
          headline: summary.neutralHeadline,
          description: data.shortSummary,
          body: data.paragraphs.map((paragraph) => paragraph.text).join("\n\n"),
          datePublished: summary.publishedAt,
          dateModified: summary.rewrittenAt,
          sourceUrls: data.sources.map((source) => source.url),
          sourceCount: summary.sourceCount,
        })}
      />

      <Container width="content" className="pt-8 sm:pt-12">
        <Breadcrumbs
          items={[
            { name: "Artikel", path: "/artikel" },
            { name: summary.neutralHeadline, path },
          ]}
        />

        <header className="mt-8 max-w-4xl">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
            <SourceSpectrum covered={leans} />
            <a href="#quellen" className="tabular font-semibold text-ink-soft hover:text-brand-ink">
              {summary.sourceCount} Quellen
            </a>
            {summary.status === "corrected" ? <Badge variant="warn">korrigiert</Badge> : null}
            {summary.version > 1 ? <Badge variant="muted">Version {summary.version}</Badge> : null}
          </div>
          <h1 id="article-headline" className="mt-4 font-display text-display">
            {summary.neutralHeadline}
          </h1>
          {/* Answer first: the short summary is what answer engines quote. */}
          <p id="kurzfassung" className="mt-5 max-w-3xl font-serif text-ink-soft text-lede">
            {data.shortSummary}
          </p>
          <p className="mt-5 text-ink-mute text-sm">
            Stand:{" "}
            <time dateTime={summary.rewrittenAt.toISOString()} className="text-ink-soft">
              {formatDate(summary.rewrittenAt, "datetime")}
            </time>
            {summary.publishedAt &&
            summary.publishedAt.getTime() !== summary.rewrittenAt.getTime() ? (
              <>
                {", erstmals veröffentlicht "}
                <time dateTime={summary.publishedAt.toISOString()}>
                  {formatDate(summary.publishedAt, "datetime")}
                </time>
              </>
            ) : null}
          </p>
          <div className="mt-6">
            <ShareMenu
              summaryId={summary.id}
              title={summary.neutralHeadline}
              sourceCount={summary.sourceCount}
              canonicalUrl={absoluteUrl(path)}
            />
          </div>
        </header>
      </Container>

      <Container
        width="content"
        className="mt-10 grid gap-x-14 gap-y-10 border-line-soft border-t pt-10 lg:grid-cols-[minmax(0,1fr)_14rem]"
      >
        <div className="min-w-0 space-y-16">
          {/* Contents for phones and tablets; the sidebar takes over from lg. */}
          <details className="group rounded-2xl bg-bg-warm lg:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 font-semibold [&::-webkit-details-marker]:hidden">
              In diesem Artikel
              <FiChevronDown aria-hidden className="transition-transform group-open:rotate-180" />
            </summary>
            <ul className="grid gap-1 px-3 pb-3">
              {SECTIONS.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="block rounded-xl px-2 py-2 text-ink-soft hover:bg-bg hover:text-ink"
                  >
                    {section.label}
                  </a>
                </li>
              ))}
            </ul>
          </details>

          <section aria-labelledby="zusammenfassung">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <SectionHeading id="zusammenfassung">Die Zusammenfassung</SectionHeading>
              {data.annotations.length > 0 ? (
                <Badge variant="saffron">Markierte Stellen antippen</Badge>
              ) : null}
            </div>
            <FramingText
              paragraphs={data.paragraphs}
              annotations={data.annotations}
              sources={data.sources.map((source) => ({
                id: source.id,
                name: source.outletName,
                headline: source.headline,
                url: source.url,
              }))}
            />
            <p className="mt-6 text-ink-mute text-sm">
              Quellengebundene Zusammenfassung: eine Einordnung, keine Garantie auf Neutralität.
              Unsicherheiten und Unterschiede stehen unten getrennt.
            </p>
          </section>

          <section aria-labelledby="gesichert">
            <SectionHeading id="gesichert">Was ist gesichert?</SectionHeading>
            {data.confirmedFacts.length > 0 ? (
              <ul className="mt-6 space-y-4">
                {data.confirmedFacts.map((fact) => (
                  <li key={fact.text} className="flex gap-3">
                    <span className="mt-1 grid size-6 shrink-0 place-items-center rounded-full bg-brand-wash text-brand-ink">
                      <FiCheck aria-hidden className="size-3.5" />
                    </span>
                    <div>
                      <p className="text-[1.0625rem] leading-relaxed">{fact.text}</p>
                      <SourceRefs ids={fact.source_ids} sources={data.sources} />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-ink-soft">
                Für diese ältere Zusammenfassung sind gesicherte Fakten noch nicht einzeln
                ausgewiesen. Prüfe die Quellen unten.
              </p>
            )}
          </section>

          <section aria-labelledby="unklar">
            <SectionHeading id="unklar">Was ist noch unklar?</SectionHeading>
            {data.uncertainties.length > 0 ? (
              <ul className="mt-6 space-y-4">
                {data.uncertainties.map((item) => (
                  <li key={item.text} className="flex gap-3">
                    <span className="mt-1 grid size-6 shrink-0 place-items-center rounded-full bg-warn-wash text-warn">
                      <FiHelpCircle aria-hidden className="size-3.5" />
                    </span>
                    <div>
                      <p className="text-[1.0625rem] leading-relaxed">{item.text}</p>
                      <SourceRefs ids={item.source_ids} sources={data.sources} />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-ink-soft">
                Aktuell sind keine offenen Punkte ausgewiesen. Das heißt nicht, dass keine
                Unsicherheit besteht.
              </p>
            )}
          </section>

          <section aria-labelledby="unterschiede">
            <SectionHeading id="unterschiede">Wo unterscheiden sich die Quellen?</SectionHeading>
            {data.differences.length > 0 ? (
              <div className="mt-6 space-y-6">
                {data.differences.map((difference) => (
                  <article key={difference.topic} className="rounded-2xl border border-line">
                    <header className="p-5">
                      <h3 className="font-display text-lg">{difference.topic}</h3>
                      <p className="mt-1 text-ink-soft">{difference.explanation}</p>
                    </header>
                    <div className="grid border-line-soft border-t sm:grid-cols-2">
                      {difference.positions.map((position) => (
                        <div
                          key={position.label}
                          className="border-line-soft p-5 max-sm:not-first:border-t sm:not-first:border-l"
                        >
                          <p className="leading-relaxed">{position.label}</p>
                          <SourceRefs ids={position.source_ids} sources={data.sources} />
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-ink-soft">
                Für diese Version sind keine konkreten Widersprüche ausgewiesen. Unterschiedliche
                Schlagzeilen und Gewichtungen bleiben in den Quellen sichtbar.
              </p>
            )}
          </section>

          <section aria-labelledby="quellen">
            <SectionHeading id="quellen">
              Welche Quellen wurden verwendet?{" "}
              <span className="tabular text-ink-mute">{data.sources.length}</span>
            </SectionHeading>
            <p className="mt-3 max-w-2xl text-ink-soft">
              Viele Quellen sind kein Qualitätsbeweis. Entscheidend ist, was eine Quelle belegt und
              ob sie Primärinformationen enthält.
            </p>
            <div className="mt-6 rounded-3xl bg-bg-warm p-5 [--skewer-ring:var(--bg-warm)] sm:p-6">
              <SourceSkewer
                outlets={data.sources.map((source) => ({
                  name: source.outletName,
                  lean: source.outletLean,
                }))}
              />
            </div>
            {data.sourceReceiptMode === "legacy_best_effort" ? (
              <p className="mt-4 rounded-2xl bg-warn-wash p-4 text-ink-soft text-sm">
                Diese ältere Version stammt aus der Zeit vor exakten Quellenbelegen. Angezeigt wird
                pro damals gespeichertem Medium der zeitlich passendste Beitrag.
              </p>
            ) : null}
            <div className="mt-4">
              {data.sources.map((source) => (
                <SourceItem
                  key={source.id}
                  source={{ ...source, primary: source.sourceKind === "primary" }}
                />
              ))}
            </div>
          </section>

          {correctionHistory.length > 0 ? (
            <section aria-labelledby="history-heading">
              <SectionHeading id="history-heading">Änderungen und Korrekturen</SectionHeading>
              <ol className="mt-6 space-y-5 border-brand border-l-2 pl-5">
                {correctionHistory.map((version) => (
                  <li key={version.id}>
                    <p className="text-ink-mute text-sm">
                      Version {version.version},{" "}
                      <time dateTime={version.rewrittenAt.toISOString()}>
                        {formatDate(version.rewrittenAt, "datetime")}
                      </time>
                    </p>
                    <p className="mt-1">{version.correctionNote || version.changeSummary}</p>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          <QualityRating
            summaryId={summary.id}
            initial={rating}
            isAuthenticated={Boolean(session)}
          />
          <CommentsSection
            summaryId={summary.id}
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
            aria-label="In diesem Artikel"
            className="sticky top-[calc(var(--header-h)+1.5rem)] text-sm"
          >
            <p className="font-semibold text-ink">In diesem Artikel</p>
            <ul className="mt-3 space-y-1 border-line border-l">
              {SECTIONS.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="-ml-px block border-transparent border-l-2 py-1 pl-3 text-ink-soft hover:border-brand hover:text-ink"
                  >
                    {section.label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-6 space-y-2 border-line-soft border-t pt-5">
              <Link
                href={`/themen/${data.story.slug}`}
                className="block font-semibold text-brand-ink underline-offset-4 hover:underline"
              >
                Originalbeiträge vergleichen
              </Link>
              <Link
                href="/methodik"
                className="block text-ink-soft underline-offset-4 hover:underline"
              >
                So arbeiten wir
              </Link>
            </div>
          </nav>
        </aside>
      </Container>
    </article>
  );
}
