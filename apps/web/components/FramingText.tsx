"use client";

import { Dialog } from "@base-ui/react/dialog";
import type { StoryAnnotation } from "@kebab/core";
import { resolveTextAnchor } from "@kebab/core/text-anchor";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { FiX } from "react-icons/fi";
import { Button } from "@/components/ui/button";

type SourceRef = { id: string; name: string; headline: string; url: string };

/**
 * Summary prose with framing marks. A mark opens an explanation sheet (bottom
 * sheet on phones, side panel from `sm`) built on the same base-ui Dialog as
 * the mobile nav: focus trap, scroll lock and Escape come for free.
 */
export function FramingText({
  paragraphs,
  annotations,
  sources,
}: {
  paragraphs: Array<{ id: string; text: string }>;
  annotations: StoryAnnotation[];
  sources: SourceRef[];
}) {
  const t = useTranslations("story.framing");
  const [active, setActive] = useState<StoryAnnotation | null>(null);

  return (
    <>
      <div className="prose-serif space-y-5 text-ink">
        {paragraphs.map((paragraph) => {
          const marks = annotations
            .filter(
              (item) => item.paragraph_id === paragraph.id && item.review_status !== "rejected"
            )
            .map((item) => ({ item, start: resolveTextAnchor(paragraph.text, item)?.start ?? -1 }))
            .filter((item) => item.start >= 0)
            .sort((a, b) => a.start - b.start);
          const nodes: React.ReactNode[] = [];
          let cursor = 0;
          for (const mark of marks) {
            if (mark.start < cursor) continue;
            nodes.push(paragraph.text.slice(cursor, mark.start));
            nodes.push(
              <button
                key={`${paragraph.id}-${mark.start}`}
                type="button"
                onClick={() => setActive(mark.item)}
                className="mark-highlight cursor-pointer rounded-[2px] text-left outline-none transition-colors hover:bg-saffron-wash focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={t("annotation_label", { quote: mark.item.quote })}
                aria-haspopup="dialog"
              >
                {mark.item.quote}
              </button>
            );
            cursor = mark.start + mark.item.quote.length;
          }
          nodes.push(paragraph.text.slice(cursor));
          return <p key={paragraph.id}>{nodes}</p>;
        })}
      </div>

      <Dialog.Root open={active !== null} onOpenChange={(open) => !open && setActive(null)}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-[2px] transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
          <Dialog.Popup className="fixed inset-x-0 bottom-0 z-50 max-h-[88dvh] overflow-y-auto rounded-t-3xl bg-bg p-6 shadow-2xl transition-transform duration-200 ease-out data-[ending-style]:translate-y-full data-[starting-style]:translate-y-full sm:inset-y-0 sm:right-0 sm:left-auto sm:max-h-none sm:w-full sm:max-w-md sm:rounded-none sm:p-8 sm:data-[ending-style]:translate-x-full sm:data-[starting-style]:translate-x-full sm:data-[ending-style]:translate-y-0 sm:data-[starting-style]:translate-y-0">
            {active ? (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-saffron-ink text-sm">
                      {t("eyebrow", { confidence: t(`confidence.${active.confidence}`) })}
                    </p>
                    <Dialog.Title className="mt-1 font-display text-2xl leading-tight">
                      {active.title}
                    </Dialog.Title>
                  </div>
                  <Dialog.Close
                    render={
                      <Button variant="outline" size="icon-sm" aria-label={t("close")}>
                        <FiX />
                      </Button>
                    }
                  />
                </div>
                <blockquote className="mt-6 rounded-xl bg-saffron-wash/60 p-4 font-serif text-ink text-lg">
                  „{active.quote}“
                </blockquote>
                <div className="mt-6 space-y-5 text-ink-soft text-sm leading-6">
                  <section>
                    <h3 className="font-semibold text-ink">{t("why")}</h3>
                    <p>{active.explanation}</p>
                  </section>
                  <section>
                    <h3 className="font-semibold text-ink">{t("effect")}</h3>
                    <p>{active.possible_effect}</p>
                  </section>
                  {active.alternatives.length > 0 && (
                    <section>
                      <h3 className="font-semibold text-ink">{t("alternatives")}</h3>
                      <ul className="mt-2 list-disc space-y-1 pl-5">
                        {active.alternatives.map((alternative) => (
                          <li key={alternative}>{alternative}</li>
                        ))}
                      </ul>
                    </section>
                  )}
                  <section>
                    <h3 className="font-semibold text-ink">{t("evidence")}</h3>
                    <ul className="mt-2 space-y-3">
                      {active.evidence.map((evidence) => {
                        const source = sources.find((item) => item.id === evidence.source_id);
                        return (
                          <li key={`${evidence.source_id}-${evidence.quote}`}>
                            {source ? (
                              <a
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-ink underline decoration-line underline-offset-2 hover:decoration-brand"
                              >
                                {source.name}: {source.headline}
                              </a>
                            ) : (
                              <span className="font-medium text-ink">{evidence.source_id}</span>
                            )}
                            <span className="block font-serif">„{evidence.quote}“</span>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                  <p className="rounded-xl bg-bg-warm p-3 text-xs">{t("disclaimer")}</p>
                </div>
              </>
            ) : null}
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
