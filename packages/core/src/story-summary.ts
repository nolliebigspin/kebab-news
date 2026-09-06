import { z } from "zod";
import { resolveTextAnchor } from "./text-anchor";

export { resolveTextAnchor } from "./text-anchor";

export const confidenceValues = ["low", "medium", "high"] as const;
export const reviewStatusValues = ["needs_review", "verified", "rejected"] as const;
export const annotationOriginValues = ["automatic", "manual"] as const;

const SourceIdsSchema = z.array(z.string().min(1)).min(1).max(50);

const EvidenceQuoteSchema = z.object({
  source_id: z.string().min(1),
  quote: z.string().min(1).max(500),
});

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

const StoryAnnotationFields = {
  paragraph_id: z.string().min(1).max(80),
  quote: z.string().min(1).max(500),
  prefix: z.string().max(160).optional(),
  suffix: z.string().max(160).optional(),
  category: z.string().min(1).max(80),
  title: z.string().min(1).max(160),
  explanation: z.string().min(1).max(1200),
  possible_effect: z.string().min(1).max(800),
  alternatives: z.array(z.string().min(1).max(500)).max(8).default([]),
  confidence: z.enum(confidenceValues),
  origin: z.enum(annotationOriginValues),
  review_status: z.enum(reviewStatusValues),
  created_at: z.string().datetime().optional(),
};

export const StoryAnnotationSchema = z.object({
  ...StoryAnnotationFields,
  evidence: z.array(EvidenceQuoteSchema).min(1).max(12),
});

/** Compatibility shape used before article-level evidence quotes were stored. */
export const LegacyStoryAnnotationSchema = z.object({
  ...StoryAnnotationFields,
  evidence_source_ids: SourceIdsSchema,
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

    const ranges = new Map<string, Array<{ start: number; end: number }>>();
    for (const [index, annotation] of summary.annotations.entries()) {
      if (!paragraphIds.has(annotation.paragraph_id)) {
        context.addIssue({
          code: "custom",
          path: ["annotations", index, "paragraph_id"],
          message: "annotation must reference an existing paragraph",
        });
      } else {
        const paragraph = summary.body.find((item) => item.id === annotation.paragraph_id);
        const range = resolveTextAnchor(paragraph?.text ?? "", annotation);
        const previous = ranges.get(annotation.paragraph_id) ?? [];
        if (!range || previous.some((item) => range.start < item.end && range.end > item.start)) {
          context.addIssue({
            code: "custom",
            path: ["annotations", index, "quote"],
            message: "annotation must resolve uniquely without overlapping another annotation",
          });
        } else {
          previous.push(range);
          ranges.set(annotation.paragraph_id, previous);
        }
      }
    }
  });

export type StorySummary = z.infer<typeof StorySummarySchema>;
export type StoryAnnotation = z.infer<typeof StoryAnnotationSchema>;
