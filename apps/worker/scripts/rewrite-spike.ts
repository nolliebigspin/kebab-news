import "@kebab/env/load";
/**
 * Milestone 0 — Rewrite quality spike.
 *
 * Pulls N real clustered stories from the DB (preferring stories covered by
 * the widest political spectrum), runs the neutral-rewrite prompt against
 * each, and dumps everything to tmp/rewrite-spike-<ISO>.md for human review.
 *
 * Run AFTER `bun ingest:run` has populated the DB with enough multi-outlet
 * clusters. If fewer than `--stories` candidates exist, the script picks the
 * best it can and warns.
 *
 * Usage:
 *   mise exec -- bun scripts/rewrite-spike.ts
 *   mise exec -- bun scripts/rewrite-spike.ts --stories=3
 *
 * The output is a markdown report you READ as a human. There is no
 * automated quality gate — you decide whether Product B is viable based on
 * what you see.
 */
import { mkdirSync, writeFileSync } from "node:fs";

import Anthropic from "@anthropic-ai/sdk";
import {
  LEAN_ORDER,
  REWRITE_MODEL,
  REWRITE_PROMPT_VERSION,
  REWRITE_SYSTEM_PROMPT,
  REWRITE_TARGET_WORDS_MAX,
} from "@kebab/core";
import { articles, db, type OutletLean, outlets, stories } from "@kebab/db";
import { desc, eq, sql } from "drizzle-orm";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Args
// ---------------------------------------------------------------------------

const requestedStories = (() => {
  const arg = process.argv.find((a) => a.startsWith("--stories="));
  if (!arg) return 5;
  const n = Number(arg.slice("--stories=".length));
  if (!Number.isFinite(n) || n < 1) {
    console.error(`bad --stories value: ${arg}`);
    process.exit(1);
  }
  return Math.min(n, 20);
})();

// ---------------------------------------------------------------------------
// Rewrite output contract (mirrors what production rewrite.ts will use)
// ---------------------------------------------------------------------------

const RewriteSchema = z.object({
  neutral_headline: z.string().min(1).max(200),
  neutral_body: z.string().max(8000),
});
type Rewrite = z.infer<typeof RewriteSchema>;

const REWRITE_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["neutral_headline", "neutral_body"],
  properties: {
    neutral_headline: { type: "string" },
    neutral_body: { type: "string" },
  },
} as const;

// ---------------------------------------------------------------------------
// Candidate selection
// ---------------------------------------------------------------------------

type StoryWithSpread = {
  storyId: string;
  slug: string;
  label: string;
  articleCount: number;
  leans: OutletLean[];
};

async function pickCandidates(limit: number): Promise<StoryWithSpread[]> {
  // Aggregate distinct leans per story; rank by (#distinct leans DESC,
  // article_count DESC) — wider spectrum first, more sources second.
  const rows = await db
    .select({
      storyId: stories.id,
      slug: stories.slug,
      label: stories.label,
      articleCount: stories.articleCount,
      leans: sql<OutletLean[]>`array_agg(DISTINCT ${outlets.politicalLean})`,
    })
    .from(stories)
    .innerJoin(articles, eq(articles.storyId, stories.id))
    .innerJoin(outlets, eq(outlets.id, articles.outletId))
    .groupBy(stories.id)
    .orderBy(desc(stories.lastSeenAt))
    .limit(50);

  const sorted = rows
    .map((r) => ({ ...r, leans: r.leans ?? [] }))
    .sort((a, b) => {
      if (b.leans.length !== a.leans.length) return b.leans.length - a.leans.length;
      return b.articleCount - a.articleCount;
    });

  return sorted.slice(0, limit);
}

// ---------------------------------------------------------------------------
// Per-story article fetch (headline + teaser only — milestone 0 doesn't scrape bodies)
// ---------------------------------------------------------------------------

type SourceItem = {
  outletName: string;
  outletSlug: string;
  lean: OutletLean;
  headline: string;
  teaser: string | null;
  url: string;
};

async function loadSources(storyId: string): Promise<SourceItem[]> {
  const rows = await db
    .select({
      outletName: outlets.name,
      outletSlug: outlets.slug,
      lean: outlets.politicalLean,
      headline: articles.headline,
      teaser: articles.teaser,
      url: articles.url,
    })
    .from(articles)
    .innerJoin(outlets, eq(outlets.id, articles.outletId))
    .where(eq(articles.storyId, storyId));

  return rows.sort((a, b) => LEAN_ORDER.indexOf(a.lean) - LEAN_ORDER.indexOf(b.lean));
}

// ---------------------------------------------------------------------------
// Build the user-message payload Claude gets
// ---------------------------------------------------------------------------

function buildUserMessage(label: string, sources: SourceItem[]): string {
  const lines: string[] = [];
  lines.push("Hier sind die Outlet-Versionen einer einzigen Nachrichtengeschichte.");
  lines.push(`Vorläufiges Label (aus dem Cluster, kein Titelvorschlag): ${label}`);
  lines.push("");
  lines.push("Quellen:");
  for (const s of sources) {
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

// ---------------------------------------------------------------------------
// Claude call
// ---------------------------------------------------------------------------

let cachedClient: Anthropic | null = null;
function getClient(): Anthropic {
  if (!cachedClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error("ANTHROPIC_API_KEY not set");
      process.exit(1);
    }
    cachedClient = new Anthropic({ apiKey });
  }
  return cachedClient;
}

async function generateRewrite(label: string, sources: SourceItem[]): Promise<Rewrite | null> {
  const client = getClient();
  const userMessage = buildUserMessage(label, sources);

  // Token cap: ~400 words ≈ ~600 tokens. Generous headroom for headline.
  const maxTokens = Math.min(2048, Math.ceil(REWRITE_TARGET_WORDS_MAX * 2));

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

    const block = response.content.find((b) => b.type === "text");
    if (!block || block.type !== "text") return null;

    const raw = JSON.parse(block.text) as unknown;
    const parsed = RewriteSchema.safeParse(raw);
    if (!parsed.success) {
      console.error("rewrite: schema parse failed:", parsed.error.format());
      return null;
    }
    return parsed.data;
  } catch (err) {
    if (err instanceof Anthropic.APIError) {
      console.error(`rewrite: Anthropic ${err.status} ${err.message}`);
    } else {
      console.error("rewrite: unexpected error", err);
    }
    return null;
  }
}

// ---------------------------------------------------------------------------
// Markdown report
// ---------------------------------------------------------------------------

function md(label: string, sources: SourceItem[], rewrite: Rewrite | null): string {
  const lines: string[] = [];
  lines.push(`## ${label}`);
  lines.push("");
  lines.push(
    `**Quellen (${sources.length}, Spektrum-Spreizung: ${
      new Set(sources.map((s) => s.lean)).size
    } Leans):**`
  );
  lines.push("");
  for (const s of sources) {
    lines.push(`- **${s.outletName}** _(${s.lean})_`);
    lines.push(`  - Schlagzeile: ${s.headline}`);
    if (s.teaser) lines.push(`  - Teaser: ${s.teaser}`);
    lines.push(`  - URL: ${s.url}`);
  }
  lines.push("");

  if (rewrite === null) {
    lines.push("**Rewrite:** ❌ konnte nicht generiert werden (siehe stderr).");
  } else {
    lines.push(`**Rewrite — neutral_headline:**`);
    lines.push("");
    lines.push(`> ${rewrite.neutral_headline}`);
    lines.push("");
    lines.push(`**Rewrite — neutral_body:**`);
    lines.push("");
    for (const para of rewrite.neutral_body.split(/\n{2,}/)) {
      lines.push(para.trim());
      lines.push("");
    }
  }

  lines.push("---");
  lines.push("");
  lines.push("**Dein Urteil:**");
  lines.push("");
  lines.push("- [ ] Neutralität OK");
  lines.push("- [ ] Faktentreue OK (keine erfundenen Details)");
  lines.push("- [ ] Sprachqualität OK (Standarddeutsch, keine Floskeln)");
  lines.push("- [ ] Länge OK");
  lines.push("- [ ] Insgesamt veröffentlichbar mit Disclaimer? ja / nein");
  lines.push("");
  lines.push("Notizen:");
  lines.push("");
  lines.push("");
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Entry
// ---------------------------------------------------------------------------

async function main() {
  console.log(`→ Loading top ${requestedStories} candidate stories from DB...`);
  const candidates = await pickCandidates(requestedStories);

  if (candidates.length === 0) {
    console.error("✕ No stories found. Run `bun ingest:run` first.");
    process.exit(1);
  }

  if (candidates.length < requestedStories) {
    console.warn(
      `⚠ Only ${candidates.length} candidate stories available (requested ${requestedStories}).`
    );
  }

  console.log(
    `→ Candidates: ${candidates.map((c) => `${c.slug} (${c.leans.length} leans, ${c.articleCount} sources)`).join(", ")}`
  );

  const sections: string[] = [];
  sections.push("# Rewrite-Spike (Milestone 0)");
  sections.push("");
  sections.push(`- Erstellt: ${new Date().toISOString()}`);
  sections.push(`- Modell: \`${REWRITE_MODEL}\``);
  sections.push(`- Prompt-Version: \`${REWRITE_PROMPT_VERSION}\``);
  sections.push(`- Stories: ${candidates.length}`);
  sections.push("");
  sections.push(
    "Zweck: prüfen, ob Claudes Neutralfassungen brauchbar genug sind, um Produkt B (publizierte KI-Umschreibungen) weiter zu bauen. Lies jeden Eintrag, vergleiche mit den Quellen, fülle die Checkliste aus. Wenn ≥ 80 % der Stories veröffentlichbar wären, weitermachen mit Milestone 1."
  );
  sections.push("");
  sections.push("---");
  sections.push("");

  for (const c of candidates) {
    const sources = await loadSources(c.storyId);
    console.log(`→ Rewriting story: ${c.slug} (${sources.length} sources)`);
    const rewrite = await generateRewrite(c.label, sources);
    sections.push(md(c.label, sources, rewrite));
  }

  mkdirSync("tmp", { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const outPath = `tmp/rewrite-spike-${stamp}.md`;
  writeFileSync(outPath, sections.join("\n"));
  console.log(`\n✓ Wrote ${outPath}`);
  console.log(`  Open it in your editor and judge each rewrite manually.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
