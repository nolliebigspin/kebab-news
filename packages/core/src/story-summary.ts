import { z } from "zod";

export const confidenceValues = ["low", "medium", "high"] as const;
export const reviewStatusValues = ["needs_review", "verified", "rejected"] as const;
export const annotationOriginValues = ["automatic", "manual"] as const;

const SourceIdsSchema = z.array(z.string().min(1)).min(1).max(50);

export const SummaryParagraphSchema = z.object({
  id: z.string().min(1).max(80),
  text: z.string().min(1).max(4000),
});

export const ConfirmedFactSchema = z.object({
  text: z.string().min(1).max(600),
  source_ids: SourceIdsSchema,
  confidence: z.enum(confidenceValues),
});

export const UncertaintySchema = z.object({
  text: z.string().min(1).max(600),
  source_ids: SourceIdsSchema,
  status: z.enum(["open", "disputed", "single_source", "unconfirmed"]),
});

export const SourceDifferenceSchema = z.object({
  topic: z.string().min(1).max(160),
  explanation: z.string().min(1).max(800),
  positions: z
    .array(
      z.object({
        label: z.string().min(1).max(500),
        source_ids: SourceIdsSchema,
      })
    )
    .min(2)
    .max(8),
});

export const StoryAnnotationSchema = z.object({
  paragraph_id: z.string().min(1).max(80),
  quote: z.string().min(1).max(500),
  prefix: z.string().max(160).optional(),
  suffix: z.string().max(160).optional(),
  category: z.string().min(1).max(80),
  title: z.string().min(1).max(160),
  explanation: z.string().min(1).max(1200),
  possible_effect: z.string().min(1).max(800),
  alternatives: z.array(z.string().min(1).max(500)).max(8).default([]),
  evidence_source_ids: SourceIdsSchema,
  confidence: z.enum(confidenceValues),
  origin: z.enum(annotationOriginValues),
  review_status: z.enum(reviewStatusValues),
  created_at: z.string().datetime().optional(),
});

export const StorySummarySchema = z
  .object({
    short_summary: z.string().min(1).max(800),
    body: z.array(SummaryParagraphSchema).min(1).max(30),
    confirmed_facts: z.array(ConfirmedFactSchema).max(30),
    uncertainties: z.array(UncertaintySchema).max(30),
    differences: z.array(SourceDifferenceSchema).max(20),
    annotations: z.array(StoryAnnotationSchema).max(50),
  })
  .superRefine((summary, context) => {
    const paragraphIds = new Set(summary.body.map((paragraph) => paragraph.id));
    if (paragraphIds.size !== summary.body.length) {
      context.addIssue({
        code: "custom",
        path: ["body"],
        message: "paragraph ids must be unique",
      });
    }

    for (const [index, annotation] of summary.annotations.entries()) {
      if (!paragraphIds.has(annotation.paragraph_id)) {
        context.addIssue({
          code: "custom",
          path: ["annotations", index, "paragraph_id"],
          message: "annotation must reference an existing paragraph",
        });
      }
    }
  });

export type StorySummary = z.infer<typeof StorySummarySchema>;
export type StoryAnnotation = z.infer<typeof StoryAnnotationSchema>;

type TextAnchor = Pick<StoryAnnotation, "quote" | "prefix" | "suffix">;

/**
 * Resolve a text-quote anchor after small edits. Context wins when the quote
 * occurs more than once; an ambiguous match is deliberately rejected instead
 * of highlighting the wrong passage.
 */
export function resolveTextAnchor(
  text: string,
  anchor: TextAnchor
): { start: number; end: number } | null {
  const matches: number[] = [];
  let cursor = 0;
  while (cursor <= text.length - anchor.quote.length) {
    const index = text.indexOf(anchor.quote, cursor);
    if (index === -1) break;
    matches.push(index);
    cursor = index + Math.max(anchor.quote.length, 1);
  }

  if (matches.length === 0) return null;
  if (matches.length === 1) {
    return { start: matches[0], end: matches[0] + anchor.quote.length };
  }

  const contextualMatches = matches.filter((start) => {
    const prefixMatches = anchor.prefix
      ? text.slice(Math.max(0, start - anchor.prefix.length), start) === anchor.prefix
      : true;
    const suffixMatches = anchor.suffix
      ? text.slice(
          start + anchor.quote.length,
          start + anchor.quote.length + anchor.suffix.length
        ) === anchor.suffix
      : true;
    return prefixMatches && suffixMatches;
  });

  if (contextualMatches.length !== 1) return null;
  return {
    start: contextualMatches[0],
    end: contextualMatches[0] + anchor.quote.length,
  };
}
