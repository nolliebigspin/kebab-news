import { LEAN_ORDER, RADAR_MIN_OUTLETS } from "@kebab/core";
import { articles, db, type OutletLean, outlets, publishedArticles, stories } from "@kebab/db";
import { and, desc, type SQL, sql } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PageHero } from "@/components/PageHero";
import { RadarFilters } from "@/components/RadarFilters";
import { Card } from "@/components/ui/card";
import { leanColor } from "@/lib/lean";
import { parseRadarFilters, type RadarFilters as RadarFilterState } from "@/lib/radar-filters";

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
  /** Live AI rewrite for this story, if one has been published. */
  publishedSlug: string | null;
};

async function loadStories(filters: RadarFilterState): Promise<StoryCard[]> {
  // Row-level WHERE filters: date window (by first appearance) + free-text
  // search across the story label and every article's headline/teaser.
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

  // Filter by DISTINCT outlets, not articleCount — one chatty outlet
  // publishing 5 updates of the same story is still only 1 outlet for the
  // "spectrum coverage" framing the radar is meant to surface.
  const having: SQL[] = [sql`count(DISTINCT ${articles.outletId}) >= ${RADAR_MIN_OUTLETS}`];
  if (filters.lean) {
    // Keep stories where at least one covering outlet has the requested lean.
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

export default async function RadarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslations("radar");
  const filters = parseRadarFilters(await searchParams);
  const stories_ = await loadStories(filters);

  return (
    <section className="mx-auto max-w-5xl px-6 py-12">
      <PageHero title={t("page_title")} subtitle={t("page_subtitle")} />

      <RadarFilters filters={filters} leanOptions={LEAN_ORDER} />

      {stories_.length === 0 ? (
        <p className="text-ink-mute">{filters.q ? t("empty_search") : t("empty")}</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {stories_.map((story) => (
            <li key={story.id}>
              <Card className="h-full gap-0 py-0 transition-shadow focus-within:ring-2 focus-within:ring-brand/40 hover:ring-foreground/20">
                <div className="relative flex h-full flex-col gap-4 p-5">
                  {/* The whole card is clickable via the headline's stretched link. */}
                  <div className="flex flex-col gap-1.5">
                    <Link
                      href={`/radar/${story.slug}`}
                      className="group/headline rounded-sm outline-none after:absolute after:inset-0 focus-visible:[&>h2]:text-brand-ink"
                    >
                      <h2 className="font-display text-lg leading-snug transition-colors group-hover/headline:text-brand-ink sm:text-xl">
                        {story.label}
                      </h2>
                    </Link>
                    <time
                      dateTime={story.firstSeenAt.toISOString()}
                      className="font-mono text-[11px] text-ink-mute uppercase tracking-[0.12em]"
                    >
                      {formatDate(story.firstSeenAt)}
                    </time>
                  </div>

                  {/* When a neutral rewrite is live, surface it right on the
                      card. Sits above the stretched headline link (z-10) so it
                      navigates to /artikel rather than the radar detail. */}
                  {story.publishedSlug ? (
                    <Link
                      href={`/artikel/${story.publishedSlug}`}
                      className="relative z-10 inline-flex w-fit items-center gap-1.5 rounded-full border border-brand/40 bg-brand-wash/60 px-3 py-1 font-mono text-[11px] text-brand-ink uppercase tracking-[0.12em] outline-none transition-colors hover:bg-brand-wash focus-visible:ring-2 focus-visible:ring-brand"
                    >
                      {t("published_rewrite_cta")}
                    </Link>
                  ) : null}

                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <SpectrumStrip covered={story.leans} t={t} />
                      <span className="font-mono text-[11px] text-ink-mute uppercase tracking-[0.12em]">
                        {t("article_count", { count: story.articleCount })}
                      </span>
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

// Fixed de-DE date, no time — "wann die Story zum ersten Mal erschienen ist".
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
