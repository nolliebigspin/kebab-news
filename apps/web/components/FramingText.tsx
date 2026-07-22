"use client";

import type { StoryAnnotation } from "@kebab/core";
import { useEffect, useRef, useState } from "react";
import { FiX } from "react-icons/fi";

type SourceRef = { id: string; name: string; headline: string };

function locate(text: string, annotation: StoryAnnotation) {
  const starts: number[] = [];
  let cursor = 0;
  while (cursor < text.length) {
    const start = text.indexOf(annotation.quote, cursor);
    if (start < 0) break;
    starts.push(start);
    cursor = start + Math.max(1, annotation.quote.length);
  }
  if (starts.length === 1) return starts[0];
  const contextual = starts.filter((start) => {
    const prefix = annotation.prefix
      ? text.slice(start - annotation.prefix.length, start) === annotation.prefix
      : true;
    const suffix = annotation.suffix
      ? text.slice(
          start + annotation.quote.length,
          start + annotation.quote.length + annotation.suffix.length
        ) === annotation.suffix
      : true;
    return prefix && suffix;
  });
  return contextual.length === 1 ? contextual[0] : -1;
}

export function FramingText({
  paragraphs,
  annotations,
  sources,
}: {
  paragraphs: Array<{ id: string; text: string }>;
  annotations: StoryAnnotation[];
  sources: SourceRef[];
}) {
  const [active, setActive] = useState<StoryAnnotation | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!active) return;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setActive(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  return (
    <>
      <div className="space-y-6 text-[1.05rem] text-ink leading-8">
        {paragraphs.map((paragraph) => {
          const marks = annotations
            .filter(
              (item) => item.paragraph_id === paragraph.id && item.review_status !== "rejected"
            )
            .map((item) => ({ item, start: locate(paragraph.text, item) }))
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
                className="rounded-sm bg-brand-wash px-0.5 text-left text-brand-ink underline decoration-brand decoration-dotted underline-offset-4 hover:bg-brand/15 focus-visible:outline-2 focus-visible:outline-brand"
                aria-label={`Framing-Hinweis: ${mark.item.quote}`}
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
      {active && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-ink/30 sm:items-stretch sm:justify-end"
          onMouseDown={(event) => event.currentTarget === event.target && setActive(null)}
        >
          <aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="framing-dialog-title"
            className="max-h-[88vh] w-full overflow-y-auto rounded-t-3xl bg-bg p-6 shadow-2xl sm:max-h-none sm:max-w-md sm:rounded-none sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[11px] text-brand-ink uppercase tracking-[0.14em]">
                  Mögliches Framing ·{" "}
                  {active.confidence === "high"
                    ? "hohe"
                    : active.confidence === "medium"
                      ? "mittlere"
                      : "niedrige"}{" "}
                  Sicherheit
                </p>
                <h2 id="framing-dialog-title" className="mt-2 font-display text-2xl">
                  {active.title}
                </h2>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setActive(null)}
                aria-label="Dialog schließen"
                className="rounded-full border border-line p-2 focus-visible:outline-2 focus-visible:outline-brand"
              >
                <FiX aria-hidden />
              </button>
            </div>
            <blockquote className="mt-6 border-brand border-l-2 bg-brand-wash p-4 text-lg">
              „{active.quote}“
            </blockquote>
            <div className="mt-6 space-y-5 text-ink-soft text-sm leading-6">
              <div>
                <h3 className="font-semibold text-ink">Warum diese Stelle auffällt</h3>
                <p>{active.explanation}</p>
              </div>
              <div>
                <h3 className="font-semibold text-ink">Mögliche Wirkung</h3>
                <p>{active.possible_effect}</p>
              </div>
              {active.alternatives.length > 0 && (
                <div>
                  <h3 className="font-semibold text-ink">Alternative Formulierungen</h3>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {active.alternatives.map((alternative) => (
                      <li key={alternative}>{alternative}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div>
                <h3 className="font-semibold text-ink">Belege</h3>
                <ul className="mt-2 space-y-2">
                  {sources
                    .filter((source) => active.evidence_source_ids.includes(source.id))
                    .map((source) => (
                      <li key={source.id}>
                        <span className="font-medium text-ink">{source.name}:</span> „
                        {source.headline}“
                      </li>
                    ))}
                </ul>
              </div>
              <p className="rounded-lg bg-bg-warm p-3 text-xs">
                Diese Markierung ist eine Einordnung, keine objektive Wahrheit. Die Quellen
                gewichten diesen Aspekt möglicherweise unterschiedlich.
              </p>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
