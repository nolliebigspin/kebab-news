import { desc, sql } from "drizzle-orm";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/routing";
import { articles, db, type OutletLean, outlets, stories } from "@/lib/db";
import { LEAN_ORDER } from "@/lib/lean";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "radar" });
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
    .orderBy(desc(stories.lastSeenAt))
    .limit(50);

  return rows.map((r) => ({ ...r, leans: r.leans ?? [] }));
}

export default async function RadarPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "radar" });
  const stories_ = await loadStories();

  return (
    <section className="mx-auto max-w-5xl px-6 py-12">
      <header className="mb-10">
        <h1 className="font-display text-4xl leading-tight sm:text-5xl">{t("page_title")}</h1>
        <p className="mt-3 max-w-2xl text-base text-ink-soft leading-relaxed">
          {t("page_subtitle")}
        </p>
      </header>

      {stories_.length === 0 ? (
        <p className="text-ink-mute">{t("empty")}</p>
      ) : (
        <ul className="divide-y divide-line-soft border-line-soft border-y">
          {stories_.map((story) => (
            <li key={story.id} className="py-6">
              <Link href={`/radar/${story.slug}`} className="group block">
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
