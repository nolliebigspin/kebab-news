import Link from "next/link";
import { useTranslations } from "next-intl";
import { SourceSpectrum } from "@/components/lean/SourceSpectrum";
import { Button } from "@/components/ui/button";
import { VoteButton } from "@/components/VoteButton";
import { formatDate } from "@/lib/format";
import type { TopicCardData } from "@/lib/topics";

/**
 * A source cluster. The label link stretches over the card; the action
 * (read the article or show interest) sits above that layer.
 */
export function TopicCard({
  topic,
  voteCount,
  isAuthenticated,
}: {
  topic: TopicCardData;
  voteCount: number;
  isAuthenticated: boolean;
}) {
  const t = useTranslations("radar");
  return (
    <article className="group relative flex h-full flex-col rounded-2xl border border-line-soft bg-surface p-5 transition-colors [--skewer-ring:var(--surface)] hover:border-line sm:p-6">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-ink-mute text-sm">
        <SourceSpectrum covered={topic.leans} />
        <span className="tabular font-semibold text-ink-soft">
          {t("article_count", { count: topic.articleCount })}
        </span>
        <time dateTime={topic.firstSeenAt.toISOString()}>
          {formatDate(topic.firstSeenAt, "long")}
        </time>
      </div>
      <h2 className="mt-3 font-display text-ink text-xl leading-snug transition-colors group-hover:text-brand-ink sm:text-[1.375rem]">
        <Link
          href={`/themen/${topic.slug}`}
          className="outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:after:ring-3 focus-visible:after:ring-ring/40"
        >
          {topic.label}
        </Link>
      </h2>
      <div className="relative z-10 mt-auto pt-5">
        {topic.publishedSlug ? (
          <Button
            size="sm"
            variant="outline"
            nativeButton={false}
            render={
              <Link href={`/artikel/${topic.publishedSlug}`}>{t("published_rewrite_cta")}</Link>
            }
          />
        ) : (
          <VoteButton
            storyId={topic.id}
            initialCount={voteCount}
            isAuthenticated={isAuthenticated}
          />
        )}
      </div>
    </article>
  );
}
