import { LEAN_ORDER, RADAR_MIN_OUTLETS, REWRITE_VOTE_THRESHOLD } from "@kebab/core";
import { articles, db, type OutletLean, outlets, publishedArticles, stories } from "@kebab/db";
import { and, desc, type SQL, sql } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { FiClock } from "react-icons/fi";
import { PageHero } from "@/components/PageHero";
import { RadarFilters } from "@/components/RadarFilters";
import { Card } from "@/components/ui/card";
import { VoteButton } from "@/components/VoteButton";
import { leanColor } from "@/lib/lean";
import { parseRadarFilters, type RadarFilters as RadarFilterState } from "@/lib/radar-filters";
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
  firstSeenAt: Date;
  lastSeenAt: Date;
  leans: OutletLean[];
  /** Published kebab.news article for this topic, if available. */
  publishedSlug: string | null;
};

async function loadStories(filters: RadarFilterState): Promise<StoryCard[]> {
  // Row-level WHERE filters: date window (by first appearance) + free-text
  // Search across the topic label and every original contribution's headline/teaser.
  const where: SQL[] = [];
  if (filters.days !== null) {
    where.push(sql`${stories.firstSeenAt} >= now() - make_interval(days => ${filters.days})`);
  }
  if (filters.q) {
    const term = `%${filters.q}%`;
    where.push(
      sql`(${stories.label} ILIKE ${term} OR ${articles.headline} ILIKE ${term} OR ${articles.teaser} ILIKE ${term})`
    );
  }

  // Filter by DISTINCT media, not articleCount — one very active medium
  // publishing 5 updates to the same topic still only counts once.
  const having: SQL[] = [sql`count(DISTINCT ${articles.outletId}) >= ${RADAR_MIN_OUTLETS}`];
  if (filters.lean) {
    // Keep topics where at least one covering medium has the requested lean.
    having.push(sql`bool_or(${outlets.politicalLean} = ${filters.lean}::outlet_lean)`);
  }

  const orderBy =
    filters.sort === "outlets"
      ? [desc(sql`count(DISTINCT ${articles.outletId})`), desc(stories.firstSeenAt)]
      : [desc(stories.firstSeenAt)];

  const rows = await db
    .select({
      id: stories.id,
      slug: stories.slug,
      label: stories.label,
      articleCount: stories.articleCount,
      firstSeenAt: stories.firstSeenAt,
      lastSeenAt: stories.lastSeenAt,
      leans: sql<OutletLean[]>`array_agg(DISTINCT ${outlets.politicalLean})`,
      publishedSlug: sql<
        string | null
      >`case when ${publishedArticles.publishedAt} is not null then ${stories.slug} else null end`,
    })
    .from(stories)
    .innerJoin(articles, sql`${articles.storyId} = ${stories.id}`)
    .innerJoin(outlets, sql`${outlets.id} = ${articles.outletId}`)
    .leftJoin(publishedArticles, sql`${publishedArticles.id} = ${stories.publishedArticleId}`)
    .where(where.length > 0 ? and(...where) : undefined)
    .groupBy(stories.id, publishedArticles.id)
    .having(and(...having))
    .orderBy(...orderBy)
    .limit(50);

  return rows.map((r) => ({ ...r, leans: r.leans ?? [] }));
}

export default async function TopicsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslations("radar");
  const filters = parseRadarFilters(await searchParams);
  const stories_ = await loadStories(filters);
  const [voteCounts, session] = await Promise.all([
    getCumulativeVoteCounts(stories_.map((story) => story.id)),
    getSession(),
  ]);

  return (
    <section className="mx-auto max-w-6xl px-5 py-10 sm:px-6 sm:py-16">
      <PageHero title={t("page_title")} subtitle={t("page_subtitle")} />

      <RadarFilters filters={filters} leanOptions={LEAN_ORDER} />

      {stories_.length === 0 ? (
        <p className="text-ink-mute">{filters.q ? t("empty_search") : t("empty")}</p>
      ) : (
        <ul className="grid gap-5 md:grid-cols-2">
          {stories_.map((story) => (
            <li key={story.id}>
              <Card className="h-full gap-0 py-0 focus-within:border-brand/50 hover:-translate-y-0.5 hover:border-brand/35 hover:shadow-lg">
                <div className="relative flex h-full min-h-60 flex-col p-5 sm:p-6">
                  {/* The whole card is clickable via the headline's stretched link. */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-ink-mute text-xs">
                      <FiClock className="size-3.5" aria-hidden />
                      <time dateTime={story.firstSeenAt.toISOString()}>
                        {formatDate(story.firstSeenAt)}
                      </time>
                    </div>
                    <span className="font-mono text-[10px] text-brand-ink uppercase tracking-[0.1em]">
                      Thema
                    </span>
                  </div>
                  <div className="mt-4">
                    <Link
                      href={`/themen/${story.slug}`}
                      className="group/headline rounded-sm outline-none after:absolute after:inset-0 focus-visible:[&>h2]:text-brand-ink"
                    >
                      <h2 className="text-balance font-display text-xl leading-snug transition-colors group-hover/headline:text-brand-ink sm:text-2xl">
                        {story.label}
                      </h2>
                    </Link>
                  </div>

                  <div className="mt-auto pt-6">
                    <div className="flex items-center gap-3">
                      <SpectrumStrip covered={story.leans} t={t} />
                      <span className="text-ink-mute text-xs">
                        {t("article_count", { count: story.articleCount })}
                      </span>
                    </div>
                    <div className="mt-4 border-line-soft border-t pt-4">
                      {story.publishedSlug ? (
                        <Link
                          href={`/artikel/${story.publishedSlug}`}
                          className="relative z-10 inline-flex items-center gap-2 font-semibold text-brand-ink text-sm outline-none hover:text-brand focus-visible:ring-2 focus-visible:ring-brand"
                        >
                          {t("published_rewrite_cta")}
                        </Link>
                      ) : (
                        <div className="relative z-10">
                          <VoteButton
                            storyId={story.id}
                            initialCount={voteCounts.get(story.id) ?? 0}
                            threshold={REWRITE_VOTE_THRESHOLD}
                            isAuthenticated={session !== null}
                          />
                        </div>
                      )}
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

// Fixed de-DE date, no time — when the topic first appeared.
// Pinned to Europe/Berlin so the day doesn't shift with the render server's TZ.
const dateFmt = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "Europe/Berlin",
});

function formatDate(date: Date): string {
  return dateFmt.format(date);
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
      className="inline-flex items-center gap-1"
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
