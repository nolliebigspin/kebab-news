import Link from "next/link";
import { ArticleMeta } from "@/components/cards/ArticleCard";
import { SourceSkewer, type SpectrumOutlet } from "@/components/lean/SourceSpectrum";
import { Button } from "@/components/ui/button";
import type { ArticleCardData } from "@/lib/stories";

/**
 * A featured article: headline, summary and its sources threaded on the large
 * skewer, so the homepage demonstrates the product instead of describing it.
 * Fills its parent's height so carousel slides line up.
 */
export function FeatureCard({
  article,
  outlets,
  animate,
}: {
  article: ArticleCardData;
  outlets: SpectrumOutlet[];
  animate?: boolean;
}) {
  const headlineId = `feature-${article.id}`;
  return (
    <article
      aria-labelledby={headlineId}
      className="flex w-full flex-col rounded-3xl bg-bg-warm p-5 [--skewer-ring:var(--bg-warm)] sm:p-8 lg:p-10"
    >
      <ArticleMeta
        sourceCount={article.sourceCount}
        leans={article.leans}
        date={article.updatedAt}
        corrected={article.status === "corrected"}
      />
      <h3 id={headlineId} className="mt-4 max-w-4xl font-display text-display">
        <Link
          href={`/artikel/${article.slug}`}
          className="rounded-sm outline-none transition-colors hover:text-brand-ink focus-visible:ring-3 focus-visible:ring-ring/40"
        >
          {article.headline}
        </Link>
      </h3>
      <p className="mt-4 line-clamp-4 max-w-3xl font-serif text-ink-soft text-lede">
        {article.summary}
      </p>

      <div className="mt-8 border-line border-t pt-6">
        <p className="mb-5 font-semibold text-ink text-sm">So haben die Lager berichtet</p>
        <SourceSkewer outlets={outlets} animate={animate} />
      </div>

      <div className="mt-auto flex flex-wrap gap-3 pt-8">
        <Button
          size="lg"
          nativeButton={false}
          render={
            <Link href={`/artikel/${article.slug}`} aria-describedby={headlineId}>
              Artikel lesen
            </Link>
          }
        />
        <Button
          size="lg"
          variant="outline"
          nativeButton={false}
          render={
            <Link href={`/themen/${article.slug}`} aria-describedby={headlineId}>
              Originalbeiträge vergleichen
            </Link>
          }
        />
      </div>
    </article>
  );
}
