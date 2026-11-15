import type { OutletLean } from "@kebab/db";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Container } from "@/components/layout/Container";
import { LeanDot } from "@/components/lean/Lean";
import { SourceSkewer } from "@/components/lean/SourceSpectrum";
import { SourceItem } from "@/components/sources/SourceItem";
import { Button } from "@/components/ui/button";
import { VoteButton } from "@/components/VoteButton";
import { formatDate } from "@/lib/format";
import { SPECTRUM } from "@/lib/lean";
import { pageMetadata } from "@/lib/seo";
import { getSession } from "@/lib/session";
import { loadTopic, type TopicContribution } from "@/lib/topics";
import { countVotes } from "@/lib/vote";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await loadTopic(slug);
  if (!data) return { title: "Thema nicht gefunden", robots: { index: false } };
  const outletCount = new Set(data.contributions.map((item) => item.outletSlug)).size;
  return pageMetadata({
    title: `${data.story.label}: Quellenvergleich`,
    description: `${outletCount} Medien im Vergleich: Wie berichten Medien von links bis rechts über „${data.story.label}“? Schlagzeilen, Teaser und mögliche Rahmungen nebeneinander.`,
    path: `/themen/${data.story.slug}`,
    image: `/themen/${data.story.slug}/opengraph-image`,
    // When a published article exists it is the canonical page for this event.
    canonicalPath: data.published ? `/artikel/${data.published.slug}` : undefined,
  });
}

export default async function TopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await loadTopic(slug);
  if (!data) notFound();

  const t = await getTranslations("radar");
  const { story, contributions, published } = data;
  const [voteCount, session] = await Promise.all([countVotes(story.id), getSession()]);

  const byLean = new Map<OutletLean, TopicContribution[]>();
  for (const item of contributions) {
    byLean.set(item.outletLean, [...(byLean.get(item.outletLean) ?? []), item]);
  }
  const outletCount = new Set(contributions.map((item) => item.outletSlug)).size;

  return (
    <Container width="content" as="article" className="py-10 sm:py-14">
      <Breadcrumbs
        items={[
          { name: t("page_title"), path: "/themen" },
          { name: story.label, path: `/themen/${story.slug}` },
        ]}
      />

      <header className="mt-8 max-w-4xl">
        <p className="font-semibold text-ink-soft text-sm">
          {t("compare_kicker", { outlets: outletCount })}{" "}
          <time dateTime={story.firstSeenAt.toISOString()} className="font-normal text-ink-mute">
            {t("first_seen", { date: formatDate(story.firstSeenAt, "long") })}
          </time>
        </p>
        <h1 className="mt-3 font-display text-display">{story.label}</h1>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          {published ? (
            <Button
              size="lg"
              nativeButton={false}
              render={<Link href={`/artikel/${published.slug}`}>{t("published_rewrite_cta")}</Link>}
            />
          ) : (
            <VoteButton
              storyId={story.id}
              initialCount={voteCount}
              isAuthenticated={session !== null}
            />
          )}
        </div>
      </header>

      <section
        aria-labelledby="spectrum-heading"
        className="mt-10 rounded-3xl bg-bg-warm p-5 [--skewer-ring:var(--bg-warm)] sm:p-8"
      >
        <h2 id="spectrum-heading" className="mb-6 font-semibold text-ink text-sm">
          {t("spectrum_heading")}
        </h2>
        <SourceSkewer
          outlets={contributions.map((item) => ({ name: item.outletName, lean: item.outletLean }))}
        />
      </section>

      <div className="mt-12 space-y-12">
        {SPECTRUM.map((lean) => {
          const group = byLean.get(lean) ?? [];
          if (group.length === 0) return null;
          return (
            <section key={lean} aria-labelledby={`lean-${lean}`}>
              <h2
                id={`lean-${lean}`}
                className="flex items-center gap-2.5 border-ink border-b-2 pb-3 font-display text-xl"
              >
                <LeanDot lean={lean} className="size-3" />
                {t(`lean.${lean}`)}
                <span className="tabular font-normal text-base text-ink-mute">{group.length}</span>
              </h2>
              <div>
                {group.map((item) => (
                  <SourceItem key={item.id} source={item} showLean={false} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </Container>
  );
}
