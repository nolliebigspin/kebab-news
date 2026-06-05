import { LEAN_ORDER, RADAR_MIN_OUTLETS, REWRITE_VOTE_THRESHOLD } from "@kebab/core";
import { articles, db, type OutletLean, outlets, stories } from "@kebab/db";
import { desc, sql } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PageHero } from "@/components/PageHero";
import { Card } from "@/components/ui/card";
import { VoteButton } from "@/components/VoteButton";
import { leanColor } from "@/lib/lean";
import { getSession } from "@/lib/session";
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
  const [voteCounts, session] = await Promise.all([
    getCumulativeVoteCounts(stories_.map((s) => s.id)),
    getSession(),
  ]);
  const isAuthenticated = session !== null;

  return (
    <section className="mx-auto max-w-5xl px-6 py-12">
      <PageHero title={t("page_title")} subtitle={t("page_subtitle")} />

      {stories_.length === 0 ? (
        <p className="text-ink-mute">{t("empty")}</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {stories_.map((story) => (
            <li key={story.id}>
              <Card className="h-full gap-0 py-0 transition-shadow focus-within:ring-2 focus-within:ring-brand/40 hover:ring-foreground/20">
                <div className="relative flex h-full flex-col gap-4 p-5">
                  {/* The whole card is clickable via the headline's stretched
                      link; the vote control sits above it (relative + z) so it
                      stays independently interactive. */}
                  <Link
                    href={`/radar/${story.slug}`}
                    className="group/headline rounded-sm outline-none after:absolute after:inset-0 focus-visible:[&>h2]:text-brand-ink"
                  >
                    <h2 className="font-display text-lg leading-snug transition-colors group-hover/headline:text-brand-ink sm:text-xl">
                      {story.label}
                    </h2>
                  </Link>

                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <SpectrumStrip covered={story.leans} t={t} />
                      <span className="font-mono text-[11px] text-ink-mute uppercase tracking-[0.12em]">
                        {t("article_count", { count: story.articleCount })}
                      </span>
                    </div>
                    {/* Above the stretched link so it stays clickable. */}
                    <div className="relative z-10">
                      <VoteButton
                        storyId={story.id}
                        initialCount={voteCounts.get(story.id) ?? 0}
                        threshold={REWRITE_VOTE_THRESHOLD}
                        isAuthenticated={isAuthenticated}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function SpectrumStrip({
  covered,
  t,
}: {
  covered: OutletLean[];
  t: Awaited<ReturnType<typeof getTranslations<"radar">>>;
}) {
  const set = new Set(covered);
  const coveredNames = LEAN_ORDER.filter((l) => set.has(l))
    .map((l) => t(`lean.${l}`))
    .join(", ");
  return (
    <span
      className="inline-flex items-center gap-1.5"
      role="img"
      aria-label={t("spectrum_label", { leans: coveredNames })}
    >
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
