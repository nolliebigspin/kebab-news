import Anthropic from "@anthropic-ai/sdk";
import { env } from "@kebab/env";
import { z } from "zod";

import { ANNOTATION_MODEL, ANNOTATION_SYSTEM_PROMPT, MAX_ANNOTATION_SPANS } from "./constants";

export const annotationTypeValues = [
  "loaded-term",
  "emotional-trigger",
  "presupposition",
  "euphemism",
  "omission",
] as const;
export type AnnotationType = (typeof annotationTypeValues)[number];

const inlineAnnotationTypeValues = [
  "loaded-term",
  "emotional-trigger",
  "presupposition",
  "euphemism",
] as const satisfies readonly AnnotationType[];

export const AnnotationSchema = z
  .object({
    start: z.number().int().nonnegative(),
    end: z.number().int().positive(),
    quote: z.string().min(1).optional(),
    type: z.enum(annotationTypeValues),
    note: z.string().min(1).max(280),
  })
  .refine((a) => a.start < a.end, { message: "start must be < end" });

// Keep accepting up to ten legacy offset-only annotations from persisted rows.
// New model output is capped more conservatively by anchorAnnotationQuotes().
export const AnnotationsSchema = z.array(AnnotationSchema).max(10);
export type Annotation = z.infer<typeof AnnotationSchema>;

const AnnotationQuoteSchema = z.object({
  quote: z.string().min(1),
  type: z.enum(inlineAnnotationTypeValues),
  note: z.string().min(1).max(280),
});
export type AnnotationQuote = z.infer<typeof AnnotationQuoteSchema>;

/**
 * Resolve model-provided quotes against the original string. Only unique,
 * exact matches survive; ambiguous, missing and overlapping candidates are
 * omitted rather than risking a marker on the wrong text.
 */
export function anchorAnnotationQuotes(
  text: string,
  candidates: readonly AnnotationQuote[]
): Annotation[] {
  const anchored: Annotation[] = [];
  const seenQuotes = new Set<string>();

  for (const candidate of candidates) {
    if (anchored.length >= MAX_ANNOTATION_SPANS) break;
    if (seenQuotes.has(candidate.quote)) continue;

    const start = text.indexOf(candidate.quote);
    if (start < 0 || text.indexOf(candidate.quote, start + candidate.quote.length) >= 0) {
      continue;
    }

    const end = start + candidate.quote.length;
    if (anchored.some((item) => start < item.end && end > item.start)) continue;

    anchored.push({ ...candidate, start, end });
    seenQuotes.add(candidate.quote);
  }

  return anchored.sort((a, b) => a.start - b.start);
}

// Anthropic's output_config JSON-schema validator rejects validation keywords
// like maxItems. The cap is enforced locally after schema validation.
const JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["annotations"],
  properties: {
    annotations: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["quote", "type", "note"],
        properties: {
          quote: { type: "string" },
          type: {
            type: "string",
            enum: inlineAnnotationTypeValues as unknown as string[],
          },
          note: { type: "string" },
        },
      },
    },
  },
} as const;

let cachedClient: Anthropic | null = null;

function getClient(): Anthropic {
  if (!cachedClient) {
    if (!env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is required to call annotateText()");
    }
    cachedClient = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  }
  return cachedClient;
}

/**
 * Annotate framing language in a single piece of publisher text (headline or
 * teaser). An empty array is a successful, neutral result; null means the
 * request failed and callers must preserve the last valid analysis.
 */
export async function annotateText(text: string): Promise<Annotation[] | null> {
  if (!text || text.trim().length === 0) return [];

  try {
    const client = getClient();
    const response = await client.messages.create({
      model: ANNOTATION_MODEL,
      max_tokens: 1024,
      system: ANNOTATION_SYSTEM_PROMPT,
      output_config: {
        format: { type: "json_schema", schema: JSON_SCHEMA },
      },
      messages: [
        {
          role: "user",
          content: `Annotiere das folgende Framing:\n\n${text}`,
        },
      ],
    });

    const block = response.content.find((b) => b.type === "text");
    if (!block || block.type !== "text") return null;

    const raw = JSON.parse(block.text) as unknown;
    const parsed = z
      .array(AnnotationQuoteSchema)
      .safeParse((raw as { annotations?: unknown })?.annotations ?? []);
    if (!parsed.success) {
      console.error("annotate: schema parse failed", parsed.error.format());
      return null;
    }

    return anchorAnnotationQuotes(text, parsed.data);
  } catch (err) {
    if (err instanceof Anthropic.APIError) {
      console.error(`annotate: Anthropic ${err.status} ${err.message}`);
    } else {
      console.error("annotate: unexpected error", err);
    }
    return null;
  }
}
