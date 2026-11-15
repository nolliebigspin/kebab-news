import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { TopicCard } from "@/components/cards/TopicCard";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { RadarFilters } from "@/components/RadarFilters";
import { Button } from "@/components/ui/button";
import { serializeFilters } from "@/lib/filters";
import { DEFAULT_RADAR_FILTERS, parseRadarFilters } from "@/lib/radar-filters";
import { pageMetadata } from "@/lib/seo";
import { getSession } from "@/lib/session";
import { loadTopics } from "@/lib/topics";
import { getCumulativeVoteCounts } from "@/lib/vote";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("radar");
  return pageMetadata({ title: t("page_title"), description: t("page_subtitle"), path: "/themen" });
}

export default async function TopicsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslations("radar");
  const filters = parseRadarFilters(await searchParams);
  const topics = await loadTopics(filters);
  const [voteCounts, session] = await Promise.all([
    getCumulativeVoteCounts(topics.map((topic) => topic.id)),
    getSession(),
  ]);
  const allTime = serializeFilters({ ...filters, days: null }, DEFAULT_RADAR_FILTERS);

  return (
    <Container className="py-12 sm:py-16">
      <PageHeader title={t("page_title")} lede={t("page_subtitle")} className="mb-10" />
      <RadarFilters filters={filters} />

      {topics.length === 0 ? (
        <div className="max-w-xl">
          <p className="text-ink-soft text-lede">{filters.q ? t("empty_search") : t("empty")}</p>
          {filters.days !== null ? (
            <Button
              className="mt-5"
              variant="outline"
              nativeButton={false}
              render={<Link href={`/themen?${allTime}`}>{t("empty_widen")}</Link>}
            />
          ) : null}
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {topics.map((topic) => (
            <li key={topic.id}>
              <TopicCard
                topic={topic}
                voteCount={voteCounts.get(topic.id) ?? 0}
                isAuthenticated={session !== null}
              />
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
