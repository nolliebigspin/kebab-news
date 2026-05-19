import { useTranslations } from "next-intl";

import type { Annotation } from "@/lib/annotate";

type Props = {
  text: string;
  annotations: readonly Annotation[];
  className?: string;
};

/**
 * Render `text` with `<mark>` spans for each annotation. Spans are walked in
 * order; overlapping or out-of-range annotations are clipped defensively.
 * Hover/focus on a mark surfaces the framing note as a tooltip via the
 * native `title` attribute.
 */
export function AnnotatedText({ text, annotations, className }: Props) {
  const t = useTranslations("radar");

  if (annotations.length === 0) {
    return <span className={className}>{text}</span>;
  }

  // Sort + clip to text bounds; drop invalid spans defensively.
  const safe = [...annotations]
    .filter((a) => a.start < a.end && a.start >= 0 && a.end <= text.length)
    .sort((a, b) => a.start - b.start);

  const parts: Array<{ kind: "text" | "mark"; text: string; annotation?: Annotation }> = [];
  let cursor = 0;
  for (const a of safe) {
    if (a.start < cursor) continue; // overlap — skip
    if (a.start > cursor) parts.push({ kind: "text", text: text.slice(cursor, a.start) });
    parts.push({ kind: "mark", text: text.slice(a.start, a.end), annotation: a });
    cursor = a.end;
  }
  if (cursor < text.length) parts.push({ kind: "text", text: text.slice(cursor) });

  return (
    <span className={className}>
      {parts.map((part, i) =>
        part.kind === "text" ? (
          <span key={`t-${i}-${part.text.slice(0, 8)}`}>{part.text}</span>
        ) : (
          <mark
            key={`m-${part.annotation?.start ?? i}-${part.annotation?.end ?? i}`}
            className="rounded-sm bg-brand-wash px-[2px] text-brand-ink decoration-brand-ink decoration-dotted underline-offset-2 hover:underline"
            title={`${t(`annotation.${part.annotation?.type}`)} — ${part.annotation?.note ?? ""}`}
          >
            {part.text}
          </mark>
        )
      )}
    </span>
  );
}
