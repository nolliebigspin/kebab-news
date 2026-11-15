import type { OutletLean } from "@kebab/db";
import { useTranslations } from "next-intl";
import type { CSSProperties } from "react";
import { LeanDot } from "@/components/lean/Lean";
import { orderLeans, SPECTRUM } from "@/lib/lean";
import { cn } from "@/lib/utils";

/**
 * "Der Spieß": the political spectrum as a skewer. One stop per lean, left →
 * right (public broadcasters last). Covered leans are filled, blind spots are
 * hollow. This is the product's signature device — logo, hero, cards and the
 * article's source section all use it.
 */
export function SourceSpectrum({
  covered,
  className,
}: {
  covered: Iterable<OutletLean>;
  className?: string;
}) {
  const t = useTranslations("radar");
  const set = new Set(covered);
  const names = orderLeans(set)
    .map((lean) => t(`lean.${lean}`))
    .join(", ");
  return (
    <span
      role="img"
      aria-label={t("spectrum_label", { leans: names || "—" })}
      className={cn("relative inline-flex w-28 shrink-0 items-center justify-between", className)}
    >
      <span aria-hidden className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-brand" />
      {SPECTRUM.map((lean) => (
        <LeanDot
          key={lean}
          lean={lean}
          hollow={!set.has(lean)}
          className="relative size-2.5 ring-(--skewer-ring) ring-2"
        />
      ))}
    </span>
  );
}

export type SpectrumOutlet = { name: string; lean: OutletLean };

/**
 * Large skewer with outlet names threaded onto their lean's stop. Horizontal
 * when its container is at least 42rem wide, vertical (like the logo)
 * otherwise, so names never get squeezed: a container query, not a viewport
 * breakpoint, because the article sidebar narrows the column on desktop.
 */
export function SourceSkewer({
  outlets,
  animate,
  className,
}: {
  outlets: SpectrumOutlet[];
  animate?: boolean;
  className?: string;
}) {
  const t = useTranslations("radar");
  const byLean = new Map<OutletLean, string[]>();
  for (const outlet of outlets) {
    const list = byLean.get(outlet.lean) ?? [];
    if (!list.includes(outlet.name)) list.push(outlet.name);
    byLean.set(outlet.lean, list);
  }

  return (
    <div className={cn("@container", className)}>
      <div className="relative">
        {/* The skewer itself: vertical when narrow, horizontal when wide. */}
        <span
          aria-hidden
          className={cn(
            "absolute @2xl:top-[7px] top-2 @2xl:right-0 @2xl:bottom-auto bottom-2 @2xl:left-0 left-[7px] @2xl:h-1 @2xl:w-auto w-1 rounded-full bg-brand",
            animate && "animate-skewer-draw"
          )}
        />
        <ol className="relative grid @2xl:grid-cols-7 @2xl:gap-3 gap-4">
          {SPECTRUM.map((lean, index) => {
            const names = byLean.get(lean) ?? [];
            const missing = names.length === 0;
            return (
              <li
                key={lean}
                className={cn(
                  "flex @2xl:flex-col @2xl:gap-2.5 gap-3",
                  animate && "animate-skewer-thread"
                )}
                style={animate ? ({ "--i": index } as CSSProperties) : undefined}
              >
                <LeanDot
                  lean={lean}
                  hollow={missing}
                  className="relative @2xl:mt-0 mt-0.5 size-[18px] border-[3px] ring-(--skewer-ring) ring-4"
                />
                <div className="min-w-0">
                  <p
                    className={cn("font-semibold text-sm", missing ? "text-ink-mute" : "text-ink")}
                  >
                    {t(`lean.${lean}`)}
                  </p>
                  {missing ? (
                    <p className="mt-0.5 text-ink-mute text-xs">{t("not_reported")}</p>
                  ) : (
                    <p className="mt-0.5 text-ink-soft text-xs leading-5">{names.join(", ")}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
