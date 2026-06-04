import { LEAN_ORDER, RADAR_MIN_OUTLETS, REWRITE_VOTE_THRESHOLD } from "@kebab/core";
import { articles, db, type OutletLean, outlets, stories } from "@kebab/db";
import { desc, sql } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PageHero } from "@/components/PageHero";
import { VoteButton } from "@/components/VoteButton";
import { getCumulativeVoteCounts } from "@/lib/vote";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("radar");
  return { title: `${t("page_title")} — kebab.news`, description: t("page_subtitle") };
}

type StoryCard = {
  id: string;
  slug: string;
  label: string;
  articleCount: number;
  lastSeenAt: Date;
  leans: OutletLean[];
};

async function loadStories(): Promise<StoryCard[]> {
  // Filter by DISTINCT outlets, not articleCount — one chatty outlet
  // publishing 5 updates of the same story is still only 1 outlet for the
  // "spectrum coverage" framing the radar is meant to surface.
  const rows = await db
    .select({
      id: stories.id,
      slug: stories.slug,
      label: stories.label,
      articleCount: stories.articleCount,
      lastSeenAt: stories.lastSeenAt,
      leans: sql<OutletLean[]>`array_agg(DISTINCT ${outlets.politicalLean})`,
    })
    .from(stories)
    .innerJoin(articles, sql`${articles.storyId} = ${stories.id}`)
    .innerJoin(outlets, sql`${outlets.id} = ${articles.outletId}`)
    .groupBy(stories.id)
    .having(sql`count(DISTINCT ${articles.outletId}) >= ${RADAR_MIN_OUTLETS}`)
    .orderBy(desc(stories.lastSeenAt))
    .limit(50);

  return rows.map((r) => ({ ...r, leans: r.leans ?? [] }));
}

export default async function RadarPage() {
  const t = await getTranslations("radar");
  const stories_ = await loadStories();
  const voteCounts = await getCumulativeVoteCounts(stories_.map((s) => s.id));

  return (
    <section className="mx-auto max-w-5xl px-6 py-12">
      <PageHero title={t("page_title")} subtitle={t("page_subtitle")} />

      {stories_.length === 0 ? (
        <p className="text-ink-mute">{t("empty")}</p>
      ) : (
        <ul className="divide-y divide-line-soft border-line-soft border-y">
          {stories_.map((story) => (
            <li key={story.id} className="flex flex-wrap items-start justify-between gap-4 py-6">
              {/* Vote lives OUTSIDE the Link so its own hover state is isolated
                  from the headline's row-hover and clicking it never navigates. */}
              <Link href={`/radar/${story.slug}`} className="group min-w-0 flex-1">
                <h2 className="font-display text-xl leading-snug transition-colors group-hover:text-brand sm:text-2xl">
                  {story.label}
                </h2>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-ink-mute text-sm">
                  <span className="font-mono text-[11px] uppercase tracking-[0.12em]">
                    {t("article_count", { count: story.articleCount })}
                  </span>
                  <SpectrumStrip covered={story.leans} />
                </div>
              </Link>
              <VoteButton
                storyId={story.id}
                initialCount={voteCounts.get(story.id) ?? 0}
                threshold={REWRITE_VOTE_THRESHOLD}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function SpectrumStrip({ covered }: { covered: OutletLean[] }) {
  const set = new Set(covered);
  return (
    <span className="inline-flex items-center gap-1.5" aria-hidden>
      {LEAN_ORDER.map((lean) => (
        <span
          key={lean}
          className="dot"
          style={{
            background: set.has(lean) ? leanColor(lean) : "transparent",
            border: set.has(lean) ? "none" : "1px solid var(--line)",
          }}
        />
      ))}
    </span>
  );
}

function leanColor(lean: OutletLean): string {
  switch (lean) {
    case "left":
    case "center-left":
      return "var(--left)";
    case "right":
    case "center-right":
    case "right-fringe":
      return "var(--right)";
    case "center":
      return "var(--ink-mute)";
    case "public":
      return "var(--brand)";
  }
}
