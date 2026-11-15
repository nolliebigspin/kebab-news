import type { OutletLean } from "@kebab/db";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { SourceSpectrum } from "@/components/lean/SourceSpectrum";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";

export type ArticleCardProps = {
  slug: string;
  headline: string;
  summary: string;
  sourceCount: number;
  leans: OutletLean[];
  date: Date;
  corrected?: boolean;
  variant?: "default" | "compact";
  headingLevel?: "h2" | "h3";
};

/**
 * A published article as a typographic row: rule, skewer, headline, serif
 * summary. The headline link stretches over the whole row.
 */
export function ArticleCard({
  slug,
  headline,
  summary,
  sourceCount,
  leans,
  date,
  corrected,
  variant = "default",
  headingLevel: Heading = "h3",
}: ArticleCardProps) {
  return (
    <article className="group relative flex h-full flex-col border-ink border-t-2 pt-4">
      <ArticleMeta sourceCount={sourceCount} leans={leans} date={date} corrected={corrected} />
      <Heading
        className={cn(
          "mt-3 font-display text-ink transition-colors group-hover:text-brand-ink",
          variant === "compact"
            ? "text-lg leading-snug"
            : "text-[1.375rem] leading-tight sm:text-2xl"
        )}
      >
        <Link
          href={`/artikel/${slug}`}
          className="outline-none after:absolute after:inset-0 after:rounded-sm focus-visible:after:ring-3 focus-visible:after:ring-ring/40"
        >
          {headline}
        </Link>
      </Heading>
      {variant === "default" ? (
        <p className="mt-2.5 line-clamp-3 font-serif text-[1.0625rem] text-ink-soft leading-relaxed">
          {summary}
        </p>
      ) : null}
    </article>
  );
}

/** Source count, skewer and age: shared by cards and the homepage lead. */
export function ArticleMeta({
  sourceCount,
  leans,
  date,
  corrected,
  className,
}: {
  sourceCount: number;
  leans: OutletLean[];
  date: Date;
  corrected?: boolean;
  className?: string;
}) {
  const t = useTranslations("articles");
  return (
    <div
      className={cn("flex flex-wrap items-center gap-x-3 gap-y-2 text-ink-mute text-sm", className)}
    >
      <SourceSpectrum covered={leans} />
      <span className="tabular font-semibold text-ink-soft">
        {t("source_count", { count: sourceCount })}
      </span>
      <time dateTime={date.toISOString()} title={formatDate(date, "datetime")}>
        {formatRelative(date)}
      </time>
      {corrected ? <Badge variant="warn">{t("corrected")}</Badge> : null}
    </div>
  );
}
