import type { Annotation } from "@kebab/core";
import type { OutletLean } from "@kebab/db";
import { useTranslations } from "next-intl";
import { FiExternalLink } from "react-icons/fi";
import { AnnotatedText } from "@/components/AnnotatedText";
import { LeanDot, LeanLabel } from "@/components/lean/Lean";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";

/** Teasers are cut to a short excerpt (§ 87f UrhG): the original is one click away. */
const TEASER_LIMIT = 280;

export type SourceItemData = {
  id: string;
  url: string;
  headline: string;
  teaser: string | null;
  headlineAnnotations: Annotation[];
  teaserAnnotations: Annotation[];
  publishedAt: Date;
  outletName: string;
  outletLean: OutletLean;
  author?: string | null;
  primary?: boolean;
};

/**
 * One original contribution: outlet and lean, the annotated headline and a
 * clipped teaser, and a link to the original. Used on articles and topics.
 */
export function SourceItem({
  source,
  showLean = true,
}: {
  source: SourceItemData;
  showLean?: boolean;
}) {
  const t = useTranslations("sources");
  const teaser =
    source.teaser && source.teaser.length > TEASER_LIMIT
      ? `${source.teaser.slice(0, TEASER_LIMIT).trimEnd()}…`
      : source.teaser;
  // Annotations index into the full teaser; a clipped teaser drops marks past the cut.
  const teaserAnnotations = source.teaserAnnotations.filter((a) => a.end <= TEASER_LIMIT);

  return (
    <article className="relative border-line-soft border-b py-5 last:border-b-0">
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-sm">
        <span className="font-semibold text-ink">{source.outletName}</span>
        {showLean ? (
          <span className="inline-flex items-center gap-1.5 text-ink-mute">
            <LeanDot lean={source.outletLean} />
            <LeanLabel lean={source.outletLean} />
          </span>
        ) : null}
        {source.primary ? <Badge variant="brand">{t("primary")}</Badge> : null}
      </div>
      <h3 className="mt-2 font-display text-[1.1875rem] text-ink leading-snug">
        <AnnotatedText text={source.headline} annotations={source.headlineAnnotations} />
      </h3>
      {teaser ? (
        <p className="mt-2 font-serif text-[1.0625rem] text-ink-soft leading-relaxed">
          <AnnotatedText text={teaser} annotations={teaserAnnotations} />
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-ink-mute text-sm">
        {source.author ? <span>{source.author}</span> : null}
        <time dateTime={source.publishedAt.toISOString()}>
          {formatDate(source.publishedAt, "datetime")}
        </time>
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-sm font-semibold text-brand-ink underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/40"
        >
          {t("open_original", { outlet: source.outletName })}
          <FiExternalLink aria-hidden className="size-3.5" />
        </a>
      </div>
    </article>
  );
}
