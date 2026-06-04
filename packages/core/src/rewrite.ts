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
import type { OutletLean } from "@kebab/db";
import { z } from "zod";

import { REWRITE_MODEL, REWRITE_SYSTEM_PROMPT, REWRITE_TARGET_WORDS_MAX } from "./constants";
import { LEAN_ORDER } from "./lean";

export const RewriteSchema = z.object({
  neutral_headline: z.string().min(1).max(200),
  neutral_body: z.string().max(8000),
});
export type Rewrite = z.infer<typeof RewriteSchema>;

const REWRITE_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["neutral_headline", "neutral_body"],
  properties: {
    neutral_headline: { type: "string" },
    neutral_body: { type: "string" },
  },
} as const;

export type SourceItem = {
  outletName: string;
  outletSlug: string;
  lean: OutletLean;
  headline: string;
  teaser: string | null;
  url: string;
};

/** Order sources left → public so the Claude prompt sees a consistent layout. */
export function sortSourcesByLean(sources: SourceItem[]): SourceItem[] {
  return [...sources].sort((a, b) => LEAN_ORDER.indexOf(a.lean) - LEAN_ORDER.indexOf(b.lean));
}

export function buildUserMessage(label: string, sources: SourceItem[]): string {
  const lines: string[] = [];
  lines.push("Hier sind die Outlet-Versionen einer einzigen Nachrichtengeschichte.");
  lines.push(`Vorläufiges Label (aus dem Cluster, kein Titelvorschlag): ${label}`);
  lines.push("");
  lines.push("Quellen:");
  for (const s of sortSourcesByLean(sources)) {
    lines.push("");
    lines.push(`### ${s.outletName} (${s.lean})`);
    lines.push(`Schlagzeile: ${s.headline}`);
    if (s.teaser) lines.push(`Teaser: ${s.teaser}`);
  }
  lines.push("");
  lines.push("Schreibe nun die neutrale Fassung gemäß den Output- und Inhalts-Regeln.");
  lines.push(
    "Antworte ausschließlich als JSON-Objekt mit den Feldern neutral_headline und neutral_body."
  );
  return lines.join("\n");
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
  sources: SourceItem[]
): Promise<Rewrite | null> {
  const client = getClient();
  const userMessage = buildUserMessage(label, sources);
  // German is ~2–2.5 tokens/word (denser than English). 400 words ≈ ~1000
  // tokens for the body alone; add JSON wrapper + headline + safety margin.
  // 4× the word cap keeps us safely under the 4096-token sanity ceiling
  // while never silently truncating a valid response.
  const maxTokens = Math.min(4096, REWRITE_TARGET_WORDS_MAX * 4);

  try {
    const response = await client.messages.create({
      model: REWRITE_MODEL,
      max_tokens: maxTokens,
      system: REWRITE_SYSTEM_PROMPT,
      output_config: {
        format: { type: "json_schema", schema: REWRITE_JSON_SCHEMA },
      },
      messages: [{ role: "user", content: userMessage }],
    });

    // If Claude hit the token cap, the JSON is truncated mid-string.
    // JSON.parse would throw; abort cleanly instead.
    if (response.stop_reason === "max_tokens") {
      console.error(
        `[rewrite] response truncated at max_tokens (${maxTokens}). Raise the cap or shorten the prompt.`
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
    return parsed.data;
  } catch (err) {
    if (err instanceof Anthropic.APIError) {
      console.error(`[rewrite] Anthropic ${err.status} ${err.message}`);
    } else {
      console.error("[rewrite] unexpected error", err);
    }
    return null;
  }
}
