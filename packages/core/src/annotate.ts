import { env } from "@kebab/env";
import { z } from "zod";

import {
  ANNOTATION_MODEL,
  ANNOTATION_SYSTEM_PROMPT,
  GEMINI_GENERATE_CONTENT_URL,
  MAX_ANNOTATION_SPANS,
} from "./constants";
import type { ModelUsage } from "./model-usage";

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

const JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["items"],
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "annotations"],
        properties: {
          id: { type: "string" },
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
      },
    },
  },
} as const;

const AnnotationItemSchema = z.object({
  id: z.string().min(1),
  annotations: z.array(AnnotationQuoteSchema),
});

const AnnotationBatchSchema = z.object({
  items: z.array(AnnotationItemSchema),
});

export type AnnotationInput = {
  id: string;
  text: string;
};

export type AnnotationBatchResult = {
  annotations: Record<string, Annotation[]>;
  usage: ModelUsage;
};

type GeminiResponse = {
  candidates?: Array<{
    finishReason?: string;
    content?: { parts?: Array<{ text?: string }> };
  }>;
  promptFeedback?: { blockReason?: string };
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    thoughtsTokenCount?: number;
  };
  error?: { message?: string };
};

function maxOutputTokens(inputCount: number): number {
  return Math.min(65_536, Math.max(256, 128 + inputCount * 192));
}

function geminiCostMicroUsd(inputTokens: number, outputTokens: number): number {
  // Gemini 3.5 Flash-Lite standard paid-tier rates:
  // $0.30 input / $2.50 output (including thinking tokens) per MTok.
  return Math.ceil(inputTokens * 0.3 + outputTokens * 2.5);
}

export function estimateAnnotationMaximumCostMicroUsd(inputs: readonly AnnotationInput[]): number {
  const requestBytes = new TextEncoder().encode(
    `${ANNOTATION_SYSTEM_PROMPT}\n${JSON.stringify(inputs)}\n${JSON.stringify(JSON_SCHEMA)}`
  ).length;
  // A token cannot contain less than one UTF-8 byte. The extra allowance covers
  // provider-injected structured-output instructions and request framing.
  const maximumInputTokens = requestBytes + 2_048;
  return geminiCostMicroUsd(maximumInputTokens, maxOutputTokens(inputs.length));
}

function buildUserMessage(inputs: readonly AnnotationInput[]): string {
  return [
    "Analysiere jeden Text unabhängig.",
    "Gib jeden gelieferten id-Wert genau einmal zurück, auch wenn annotations leer ist.",
    "Texte:",
    JSON.stringify(inputs),
  ].join("\n");
}

/**
 * Annotate all headline/teaser texts for one topic in a single structured
 * Gemini request. Results are keyed by caller-provided ids and quote-anchored
 * locally. null means the whole request failed and callers preserve old data.
 */
export async function annotateTexts(
  inputs: readonly AnnotationInput[]
): Promise<AnnotationBatchResult | null> {
  if (inputs.length === 0) {
    return {
      annotations: {},
      usage: {
        provider: "google",
        model: ANNOTATION_MODEL,
        inputTokens: 0,
        outputTokens: 0,
        costMicroUsd: 0,
      },
    };
  }
  const byId = new Map(inputs.map((input) => [input.id, input]));
  if (byId.size !== inputs.length || inputs.some((input) => !input.id || !input.text.trim())) {
    throw new Error("annotateTexts() requires unique ids and non-empty texts");
  }

  try {
    if (!env.GEMINI_API_KEY) {
      console.error("annotate: GEMINI_API_KEY is required");
      return null;
    }
    const response = await fetch(
      `${GEMINI_GENERATE_CONTENT_URL}/${ANNOTATION_MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: ANNOTATION_SYSTEM_PROMPT }] },
          contents: [{ role: "user", parts: [{ text: buildUserMessage(inputs) }] }],
          generationConfig: {
            maxOutputTokens: maxOutputTokens(inputs.length),
            thinkingConfig: { thinkingLevel: "minimal" },
            responseMimeType: "application/json",
            responseJsonSchema: JSON_SCHEMA,
          },
        }),
      }
    );

    const body = (await response.json().catch(() => null)) as GeminiResponse | null;
    if (!response.ok) {
      console.error(
        `annotate: Gemini ${response.status} ${body?.error?.message ?? response.statusText}`
      );
      return null;
    }

    const candidate = body?.candidates?.[0];
    if (!candidate || candidate.finishReason !== "STOP") {
      console.error(
        `annotate: Gemini stopped without a complete result (${candidate?.finishReason ?? body?.promptFeedback?.blockReason ?? "unknown"})`
      );
      return null;
    }
    const text = candidate.content?.parts
      ?.map((part) => part.text ?? "")
      .join("")
      .trim();
    if (!text) return null;

    const parsed = AnnotationBatchSchema.safeParse(JSON.parse(text) as unknown);
    if (!parsed.success) {
      console.error("annotate: schema parse failed", parsed.error.format());
      return null;
    }

    const returnedIds = new Set(parsed.data.items.map((item) => item.id));
    if (
      returnedIds.size !== parsed.data.items.length ||
      returnedIds.size !== inputs.length ||
      [...returnedIds].some((id) => !byId.has(id))
    ) {
      console.error("annotate: Gemini did not return every requested id exactly once");
      return null;
    }

    const annotations = Object.fromEntries(
      parsed.data.items.map((item) => [
        item.id,
        anchorAnnotationQuotes(byId.get(item.id)?.text ?? "", item.annotations),
      ])
    );
    const inputTokens = body?.usageMetadata?.promptTokenCount ?? 0;
    const outputTokens =
      (body?.usageMetadata?.candidatesTokenCount ?? 0) +
      (body?.usageMetadata?.thoughtsTokenCount ?? 0);
    return {
      annotations,
      usage: {
        provider: "google",
        model: ANNOTATION_MODEL,
        inputTokens,
        outputTokens,
        costMicroUsd: geminiCostMicroUsd(inputTokens, outputTokens),
      },
    };
  } catch (err) {
    console.error("annotate: unexpected error", err);
    return null;
  }
}

/** Backwards-compatible single-text convenience interface. */
export async function annotateText(text: string): Promise<Annotation[] | null> {
  if (!text || text.trim().length === 0) return [];
  const result = await annotateTexts([{ id: "text", text }]);
  return result?.annotations.text ?? null;
}
