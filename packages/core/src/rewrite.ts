/**
 * Neutral rewrite primitive. Called by `bun rewrite:run` to produce one
 * `{ neutral_headline, neutral_body }` from the headlines + teasers of every
 * outlet that covers a story.
 *
 * No DB writes here — pure orchestration around the Gemini call. The script
 * is responsible for picking the story, loading the sources, and persisting
 * the result into `published_articles`.
 *
 * The schema-validated output is the contract. On parse failure we return
 * `null` and the caller must abort — partial garbage never reaches the DB
 * (per CLAUDE.md §VI rule 6).
 */
import type { OutletLean, SourceKind } from "@kebab/db";
import { env } from "@kebab/env";
import { z } from "zod";
import {
  GEMINI_GENERATE_CONTENT_URL,
  REWRITE_MAX_OUTPUT_TOKENS,
  REWRITE_MODEL,
  REWRITE_SYSTEM_PROMPT,
} from "./constants";
import { LEAN_ORDER } from "./lean";
import type { ModelUsage } from "./model-usage";
import { StoryAnnotationSchema, StorySummarySchema } from "./story-summary";

export const RewriteSchema = StorySummarySchema.safeExtend({
  neutral_headline: z.string().min(1).max(200),
  neutral_body: z.string().max(8000),
  change_summary: z.string().min(1).max(800).nullable(),
});
export type Rewrite = z.infer<typeof RewriteSchema>;

const GeneratedRewriteSchema = z
  .object({
    ...RewriteSchema.shape,
    annotations: z
      .array(StoryAnnotationSchema.omit({ origin: true, review_status: true, created_at: true }))
      .max(50),
  })
  .omit({ neutral_body: true });

function compactSources(sources: SourceItem[]): SourceItem[] {
  if (
    new Set(sources.map((source) => source.id)).size !== sources.length ||
    sources.some((source) => !source.id)
  ) {
    throw new Error("generateRewrite() requires unique, non-empty source ids");
  }
  return sources.map((source, index) => ({ ...source, id: String(index) }));
}

const REWRITE_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "neutral_headline",
    "change_summary",
    "short_summary",
    "body",
    "confirmed_facts",
    "uncertainties",
    "differences",
    "annotations",
  ],
  properties: {
    neutral_headline: { type: "string" },
    change_summary: { type: ["string", "null"] },
    short_summary: { type: "string" },
    body: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "text"],
        properties: { id: { type: "string" }, text: { type: "string" } },
      },
    },
    confirmed_facts: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["text", "source_ids", "confidence"],
        properties: {
          text: { type: "string" },
          source_ids: { type: "array", items: { type: "string" } },
          confidence: { type: "string", enum: ["low", "medium", "high"] },
        },
      },
    },
    uncertainties: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["text", "source_ids", "status"],
        properties: {
          text: { type: "string" },
          source_ids: { type: "array", items: { type: "string" } },
          status: {
            type: "string",
            enum: ["open", "disputed", "single_source", "unconfirmed"],
          },
        },
      },
    },
    differences: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["topic", "explanation", "positions"],
        properties: {
          topic: { type: "string" },
          explanation: { type: "string" },
          positions: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["label", "source_ids"],
              properties: {
                label: { type: "string" },
                source_ids: { type: "array", items: { type: "string" } },
              },
            },
          },
        },
      },
    },
    annotations: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "paragraph_id",
          "quote",
          "category",
          "title",
          "explanation",
          "possible_effect",
          "alternatives",
          "evidence",
          "confidence",
        ],
        properties: {
          paragraph_id: { type: "string" },
          quote: { type: "string" },
          prefix: { type: "string" },
          suffix: { type: "string" },
          category: { type: "string" },
          title: { type: "string" },
          explanation: { type: "string" },
          possible_effect: { type: "string" },
          alternatives: { type: "array", items: { type: "string" } },
          evidence: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["source_id", "quote"],
              properties: {
                source_id: { type: "string" },
                quote: { type: "string" },
              },
            },
          },
          confidence: { type: "string", enum: ["low", "medium", "high"] },
        },
      },
    },
  },
} as const;

export type SourceItem = {
  id: string;
  outletName: string;
  outletSlug: string;
  lean: OutletLean;
  headline: string;
  teaser: string | null;
  url: string;
  sourceKind: SourceKind;
};

/** Order sources left → public so the model prompt sees a consistent layout. */
export function sortSourcesByLean(sources: SourceItem[]): SourceItem[] {
  return [...sources].sort((a, b) => LEAN_ORDER.indexOf(a.lean) - LEAN_ORDER.indexOf(b.lean));
}

/** Reject a structurally valid model response that cites a source it never received. */
export function validateRewriteSources(rewrite: Rewrite, sources: SourceItem[]): boolean {
  const known = new Map(sources.map((source) => [source.id, source]));
  const referenced = [
    ...rewrite.confirmed_facts.flatMap((fact) => fact.source_ids),
    ...rewrite.uncertainties.flatMap((item) => item.source_ids),
    ...rewrite.differences.flatMap((difference) =>
      difference.positions.flatMap((position) => position.source_ids)
    ),
    ...rewrite.annotations.flatMap((annotation) =>
      annotation.evidence.map((evidence) => evidence.source_id)
    ),
  ];
  const referencesExist = referenced.every((sourceId) => known.has(sourceId));
  const annotationQuotesExist = rewrite.annotations.every((annotation) =>
    annotation.evidence.every((evidence) => {
      const source = known.get(evidence.source_id);
      return source
        ? [source.headline, source.teaser].some((text) => text?.includes(evidence.quote))
        : false;
    })
  );
  const factsHaveSufficientEvidence = rewrite.confirmed_facts.every((fact) => {
    const uniqueIds = [...new Set(fact.source_ids)];
    const citedSources = uniqueIds.flatMap((sourceId) => {
      const source = known.get(sourceId);
      return source ? [source] : [];
    });
    const independentOutlets = new Set(citedSources.map((source) => source.outletSlug));
    return (
      independentOutlets.size >= 2 || citedSources.some((source) => source.sourceKind === "primary")
    );
  });
  return referencesExist && annotationQuotesExist && factsHaveSufficientEvidence;
}

export type PreviousSummary = {
  headline: string;
  shortSummary: string;
  body: string;
};

export type RewriteGenerationResult = {
  rewrite: Rewrite;
  usage: ModelUsage;
};

export function buildUserMessage(
  label: string,
  sources: SourceItem[],
  previousSummary: PreviousSummary | null = null
): string {
  const lines: string[] = [];
  lines.push("Hier sind die Outlet-Versionen einer einzigen Nachrichtengeschichte.");
  lines.push(`Vorläufiges Label (aus dem Cluster, kein Titelvorschlag): ${label}`);
  lines.push("");
  lines.push("Quellen:");
  for (const s of sortSourcesByLean(sources)) {
    lines.push("");
    lines.push(`### ${s.outletName} (${s.lean}, ${s.sourceKind}, source_id: ${s.id})`);
    lines.push(`Schlagzeile: ${s.headline}`);
    if (s.teaser) lines.push(`Teaser: ${s.teaser}`);
  }
  if (previousSummary) {
    lines.push("");
    lines.push("Bisherige veröffentlichte Version:");
    lines.push(`Überschrift: ${previousSummary.headline}`);
    lines.push(`Kurzfassung: ${previousSummary.shortSummary}`);
    lines.push(`Langfassung: ${previousSummary.body}`);
    lines.push(
      "Beschreibe in change_summary konkret, welche neuen Informationen gegenüber dieser Version hinzugekommen sind."
    );
  } else {
    lines.push("");
    lines.push("Dies ist die erste Version. Setze change_summary auf null.");
  }
  lines.push("");
  lines.push("Erstelle nun die transparente Zusammenfassung gemäß den Output- und Inhalts-Regeln.");
  lines.push("Antworte ausschließlich als JSON-Objekt im vorgegebenen strukturierten Format.");
  return lines.join("\n");
}

export function estimateRewriteMaximumCostMicroUsd(
  label: string,
  sources: SourceItem[],
  previousSummary: PreviousSummary | null = null
): number {
  const requestBytes = new TextEncoder().encode(
    `${REWRITE_SYSTEM_PROMPT}\n${buildUserMessage(label, compactSources(sources), previousSummary)}\n${JSON.stringify(REWRITE_JSON_SCHEMA)}`
  ).length;
  const maximumInputTokens = requestBytes + 2_048;
  return geminiRewriteCostMicroUsd(maximumInputTokens, REWRITE_MAX_OUTPUT_TOKENS);
}

function geminiRewriteCostMicroUsd(inputTokens: number, outputTokens: number): number {
  // Gemini 3.6 Flash paid-tier rates: $1.50 input / $7.50 output per MTok.
  // Google bills thinking tokens at the output rate.
  return Math.ceil(inputTokens * 1.5 + outputTokens * 7.5);
}

type GeminiResponse = {
  candidates?: Array<{
    finishReason?: string;
    content?: { parts?: Array<{ text?: string; thought?: boolean }> };
  }>;
  promptFeedback?: { blockReason?: string };
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    thoughtsTokenCount?: number;
  };
  error?: { message?: string };
};

/**
 * One Gemini call → one parsed rewrite. Returns null on API failure or
 * schema-parse failure; caller aborts. Never persists partial output.
 */
export async function generateRewrite(
  label: string,
  sources: SourceItem[],
  previousSummary: PreviousSummary | null = null
): Promise<RewriteGenerationResult | null> {
  const requestSources = compactSources(sources);
  const userMessage = buildUserMessage(label, requestSources, previousSummary);

  try {
    if (!env.GEMINI_API_KEY) {
      console.error("[rewrite] GEMINI_API_KEY is required");
      return null;
    }
    const response = await fetch(
      `${GEMINI_GENERATE_CONTENT_URL}/${REWRITE_MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: REWRITE_SYSTEM_PROMPT }] },
          contents: [{ role: "user", parts: [{ text: userMessage }] }],
          generationConfig: {
            maxOutputTokens: REWRITE_MAX_OUTPUT_TOKENS,
            thinkingConfig: { thinkingLevel: "medium" },
            responseMimeType: "application/json",
            responseJsonSchema: REWRITE_JSON_SCHEMA,
          },
        }),
      }
    );
    const body = (await response.json().catch(() => null)) as GeminiResponse | null;
    if (!response.ok) {
      console.error(
        `[rewrite] Gemini ${response.status} ${body?.error?.message ?? response.statusText}`
      );
      return null;
    }

    const candidate = body?.candidates?.[0];
    if (!candidate || candidate.finishReason !== "STOP") {
      console.error(
        `[rewrite] Gemini stopped without a complete result (${candidate?.finishReason ?? body?.promptFeedback?.blockReason ?? "unknown"})`
      );
      return null;
    }
    const text = candidate.content?.parts
      ?.filter((part) => !part.thought)
      .map((part) => part.text ?? "")
      .join("")
      .trim();
    if (!text) return null;

    let raw: unknown;
    try {
      raw = JSON.parse(text);
    } catch (parseErr) {
      console.error(
        `[rewrite] JSON parse failed (${(parseErr as Error).message}). First 200 chars: ${text.slice(0, 200)}`
      );
      return null;
    }

    const generated = GeneratedRewriteSchema.safeParse(raw);
    if (!generated.success) {
      console.error("[rewrite] model schema parse failed:", generated.error.format());
      return null;
    }
    const sourceIds = new Map(
      requestSources.map((source, index) => [source.id, sources[index].id])
    );
    // Unknown transport ids must fail before expanding them into persisted ids.
    const normalized = {
      ...generated.data,
      neutral_body: generated.data.body.map((paragraph) => paragraph.text).join("\n\n"),
      annotations: generated.data.annotations.map((annotation) => ({
        ...annotation,
        origin: "automatic" as const,
        review_status: "needs_review" as const,
      })),
    };
    const parsed = RewriteSchema.safeParse(normalized);
    if (!parsed.success) {
      console.error("[rewrite] schema parse failed:", parsed.error.format());
      return null;
    }
    if (!validateRewriteSources(parsed.data, requestSources)) {
      console.error(
        "[rewrite] output contains invalid source references, evidence quotes or insufficient fact support"
      );
      return null;
    }
    if (previousSummary && !parsed.data.change_summary) {
      console.error("[rewrite] update output is missing change_summary");
      return null;
    }
    const inputTokens = body?.usageMetadata?.promptTokenCount ?? 0;
    const outputTokens =
      (body?.usageMetadata?.candidatesTokenCount ?? 0) +
      (body?.usageMetadata?.thoughtsTokenCount ?? 0);
    return {
      rewrite: {
        ...parsed.data,
        confirmed_facts: parsed.data.confirmed_facts.map((fact) => ({
          ...fact,
          source_ids: fact.source_ids.map((id) => sourceIds.get(id) ?? id),
        })),
        uncertainties: parsed.data.uncertainties.map((item) => ({
          ...item,
          source_ids: item.source_ids.map((id) => sourceIds.get(id) ?? id),
        })),
        differences: parsed.data.differences.map((difference) => ({
          ...difference,
          positions: difference.positions.map((position) => ({
            ...position,
            source_ids: position.source_ids.map((id) => sourceIds.get(id) ?? id),
          })),
        })),
        annotations: parsed.data.annotations.map((annotation) => ({
          ...annotation,
          evidence: annotation.evidence.map((evidence) => ({
            ...evidence,
            source_id: sourceIds.get(evidence.source_id) ?? evidence.source_id,
          })),
        })),
      },
      usage: {
        provider: "google",
        model: REWRITE_MODEL,
        inputTokens,
        outputTokens,
        costMicroUsd: geminiRewriteCostMicroUsd(inputTokens, outputTokens),
      },
    };
  } catch (err) {
    console.error("[rewrite] unexpected error", err);
    return null;
  }
}
