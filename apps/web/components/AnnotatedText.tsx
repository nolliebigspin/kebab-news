import { type Annotation, MAX_ANNOTATION_SPANS } from "@kebab/core";
import { useTranslations } from "next-intl";
import { FramingTooltip } from "@/components/ui/framing-tooltip";

type Props = {
  text: string;
  annotations: readonly Annotation[];
  className?: string;
};

/**
 * Render exact, quote-anchored annotations. Legacy offset-only or mismatched
 * annotations are omitted rather than risking a marker on the wrong passage.
 */
export function AnnotatedText({ text, annotations, className }: Props) {
  const t = useTranslations("radar");

  if (annotations.length === 0) {
    return <span className={className}>{text}</span>;
  }

  // Only trust annotations whose persisted quote still matches the source.
  const safe = [...annotations]
    .filter(
      (a) =>
        a.quote &&
        a.start < a.end &&
        a.start >= 0 &&
        a.end <= text.length &&
        text.slice(a.start, a.end) === a.quote
    )
    .sort((a, b) => a.start - b.start)
    .slice(0, MAX_ANNOTATION_SPANS);

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
          <FramingTooltip
            key={`m-${part.annotation?.start ?? i}-${part.annotation?.end ?? i}`}
            label={t(`annotation.${part.annotation?.type}`)}
            note={part.annotation?.note ?? ""}
          >
            {part.text}
          </FramingTooltip>
        )
      )}
    </span>
  );
}
