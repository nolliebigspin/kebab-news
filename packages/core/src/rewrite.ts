/**
 * Neutral rewrite primitive. Called by `bun rewrite:run` to produce one
 * `{ neutral_headline, neutral_body }` from the headlines + teasers of every
 * outlet that covers a story.
 *
 * No DB writes here — pure orchestration around the Claude call. The script
 * is responsible for picking the story, loading the sources, and persisting
 * the result into `published_articles`.
 *
 * The schema-validated output is the contract. On parse failure we return
 * `null` and the caller must abort — partial garbage never reaches the DB
 * (per CLAUDE.md §VI rule 6).
 */
import Anthropic from "@anthropic-ai/sdk";
import type { OutletLean, SourceKind } from "@kebab/db";
import { z } from "zod";
import { REWRITE_MAX_OUTPUT_TOKENS, REWRITE_MODEL, REWRITE_SYSTEM_PROMPT } from "./constants";
import { LEAN_ORDER } from "./lean";
import type { ModelUsage } from "./model-usage";
import { StorySummarySchema } from "./story-summary";

export const RewriteSchema = StorySummarySchema.extend({
  neutral_headline: z.string().min(1).max(200),
  neutral_body: z.string().max(8000),
  change_summary: z.string().min(1).max(800).nullable(),
});
export type Rewrite = z.infer<typeof RewriteSchema>;

const REWRITE_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "neutral_headline",
    "neutral_body",
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
    neutral_body: { type: "string" },
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
          "origin",
          "review_status",
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
          origin: { type: "string", enum: ["automatic", "manual"] },
          review_status: { type: "string", enum: ["needs_review", "verified", "rejected"] },
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

/** Order sources left → public so the Claude prompt sees a consistent layout. */
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
    `${REWRITE_SYSTEM_PROMPT}\n${buildUserMessage(label, sources, previousSummary)}\n${JSON.stringify(REWRITE_JSON_SCHEMA)}`
  ).length;
  const maximumInputTokens = requestBytes + 2_048;
  // Conservative standard Sonnet 5 rates after introductory pricing:
  // $3/MTok input, $3.75/MTok cache writes, $15/MTok output.
  return Math.ceil(maximumInputTokens * 3.75 + REWRITE_MAX_OUTPUT_TOKENS * 15);
}

function anthropicCostMicroUsd(usage: {
  input_tokens?: number;
  output_tokens?: number;
  cache_creation_input_tokens?: number | null;
  cache_read_input_tokens?: number | null;
}): number {
  const inputTokens = usage.input_tokens ?? 0;
  const outputTokens = usage.output_tokens ?? 0;
  const cacheCreationTokens = usage.cache_creation_input_tokens ?? 0;
  const cacheReadTokens = usage.cache_read_input_tokens ?? 0;
  return Math.ceil(
    inputTokens * 3 + outputTokens * 15 + cacheCreationTokens * 3.75 + cacheReadTokens * 0.3
  );
}

let cachedClient: Anthropic | null = null;
function getClient(): Anthropic {
  if (!cachedClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is required to call generateRewrite()");
    cachedClient = new Anthropic({ apiKey });
  }
  return cachedClient;
}

/**
 * One Claude call → one parsed rewrite. Returns null on API failure or
 * schema-parse failure; caller aborts. Never persists partial output.
 */
export async function generateRewrite(
  label: string,
  sources: SourceItem[],
  previousSummary: PreviousSummary | null = null
): Promise<RewriteGenerationResult | null> {
  const client = getClient();
  const userMessage = buildUserMessage(label, sources, previousSummary);

  try {
    const response = await client.messages
      .stream({
        model: REWRITE_MODEL,
        max_tokens: REWRITE_MAX_OUTPUT_TOKENS,
        thinking: { type: "disabled" },
        // The system prompt is identical on every call and is by far the
        // largest fixed input. Caching it bills repeat reads at 10%.
        system: [
          {
            type: "text",
            text: REWRITE_SYSTEM_PROMPT,
            cache_control: { type: "ephemeral" },
          },
        ],
        output_config: {
          format: { type: "json_schema", schema: REWRITE_JSON_SCHEMA },
        },
        messages: [{ role: "user", content: userMessage }],
      })
      .finalMessage();

    // If Claude hit the token cap, the JSON is truncated mid-string.
    // JSON.parse would throw; abort cleanly instead.
    if (response.stop_reason === "max_tokens") {
      console.error(
        `[rewrite] response truncated at max_tokens (${REWRITE_MAX_OUTPUT_TOKENS}). Shorten the requested output.`
      );
      return null;
    }

    const block = response.content.find((b) => b.type === "text");
    if (!block || block.type !== "text") return null;

    let raw: unknown;
    try {
      raw = JSON.parse(block.text);
    } catch (parseErr) {
      console.error(
        `[rewrite] JSON parse failed (${(parseErr as Error).message}). First 200 chars: ${block.text.slice(0, 200)}`
      );
      return null;
    }

    const parsed = RewriteSchema.safeParse(raw);
    if (!parsed.success) {
      console.error("[rewrite] schema parse failed:", parsed.error.format());
      return null;
    }
    if (!validateRewriteSources(parsed.data, sources)) {
      console.error("[rewrite] output references a source_id that was not provided");
      return null;
    }
    if (previousSummary && !parsed.data.change_summary) {
      console.error("[rewrite] update output is missing change_summary");
      return null;
    }
    const usage = response.usage;
    const inputTokens =
      usage.input_tokens +
      (usage.cache_creation_input_tokens ?? 0) +
      (usage.cache_read_input_tokens ?? 0);
    return {
      rewrite: parsed.data,
      usage: {
        provider: "anthropic",
        model: REWRITE_MODEL,
        inputTokens,
        outputTokens: usage.output_tokens,
        costMicroUsd: anthropicCostMicroUsd(usage),
      },
    };
  } catch (err) {
    if (err instanceof Anthropic.APIError) {
      console.error(`[rewrite] Anthropic ${err.status} ${err.message}`);
    } else {
      console.error("[rewrite] unexpected error", err);
    }
    return null;
  }
}
