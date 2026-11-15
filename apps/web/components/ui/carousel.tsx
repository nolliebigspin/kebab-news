"use client";

import { useTranslations } from "next-intl";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type CarouselSlide = {
  id: string;
  /** Accessible name of the slide, e.g. the article headline. */
  label: string;
  content: ReactNode;
};

/**
 * Swipeable, server-rendered slides on native scroll-snap. Every slide stays
 * in the DOM (crawlers and the no-JS case see all of them); JS only adds the
 * controls. No autoplay: readers move it, nothing moves on its own. The pager
 * is a small skewer, one stop per slide.
 */
export function Carousel({
  label,
  slides,
  header,
  className,
}: {
  label: string;
  slides: CarouselSlide[];
  /** Rendered left of the controls (typically the section heading). */
  header?: ReactNode;
  className?: string;
}) {
  const t = useTranslations("carousel");
  const trackRef = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);
  const total = slides.length;

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const items = Array.from(track.children) as HTMLElement[];
        // The last slide may not be able to reach the start edge.
        if (track.scrollLeft >= track.scrollWidth - track.clientWidth - 2) {
          setActive(items.length - 1);
          return;
        }
        let nearest = 0;
        for (const [index, item] of items.entries()) {
          const distance = Math.abs(item.offsetLeft - track.scrollLeft);
          if (distance < Math.abs(items[nearest].offsetLeft - track.scrollLeft)) nearest = index;
        }
        setActive(nearest);
      });
    };
    track.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(frame);
      track.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const goTo = useCallback((index: number) => {
    const track = trackRef.current;
    const item = track?.children[index] as HTMLElement | undefined;
    if (!track || !item) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.scrollTo({ left: item.offsetLeft, behavior: reduced ? "auto" : "smooth" });
  }, []);

  return (
    <section aria-roledescription="carousel" aria-label={label} className={className}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">{header}</div>
        {total > 1 ? (
          <div className="flex items-center gap-2">
            <p aria-live="polite" className="tabular mr-2 text-ink-mute text-sm">
              {t("position", { index: active + 1, total })}
            </p>
            <Button
              variant="outline"
              size="icon"
              aria-label={t("previous")}
              disabled={active === 0}
              onClick={() => goTo(active - 1)}
            >
              <FiChevronLeft />
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label={t("next")}
              disabled={active === total - 1}
              onClick={() => goTo(active + 1)}
            >
              <FiChevronRight />
            </Button>
          </div>
        ) : null}
      </div>

      <ul
        ref={trackRef}
        className="scrollbar-none relative -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto overscroll-x-contain px-4 sm:mx-0 sm:scroll-px-0 sm:px-0"
      >
        {slides.map((slide, index) => (
          <li
            key={slide.id}
            aria-roledescription="slide"
            aria-label={t("slide", { index: index + 1, total, label: slide.label })}
            data-active={index === active}
            className="flex shrink-0 basis-[88%] snap-start transition-opacity duration-300 data-[active=false]:opacity-70 sm:basis-full sm:data-[active=false]:opacity-100"
          >
            {slide.content}
          </li>
        ))}
      </ul>

      {total > 1 ? (
        <div className="mt-6 flex justify-center">
          {/* Pager: the slides threaded on a skewer. */}
          <div className="relative flex items-center gap-1">
            <span
              aria-hidden
              className="absolute inset-x-3 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-brand"
            />
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                aria-label={t("goto", { index: index + 1, total, label: slide.label })}
                aria-current={index === active ? "true" : undefined}
                onClick={() => goTo(index)}
                className="group/dot relative grid size-6 cursor-pointer place-items-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
              >
                <span
                  className={cn(
                    "block rounded-full ring-(--bg) ring-3 transition-all duration-300",
                    index === active
                      ? "size-3.5 bg-saffron"
                      : "size-2.5 border-2 border-brand bg-(--bg) group-hover/dot:bg-brand"
                  )}
                />
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
