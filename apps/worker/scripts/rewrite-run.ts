import "@kebab/env/load";
/**
 * Operator-triggered rewrite.
 *
 * Generates a transparent German summary for one story and publishes it
 * immediately — same code path as the worker's autonomous trigger, so a manual
 * run and a scheduled one produce identical results. There is no draft state
 * and no review gate.
 *
 * Usage:
 *   mise exec -- bun scripts/rewrite-run.ts --story <story-slug>
 */

import { REWRITE_MODEL, REWRITE_PROMPT_VERSION } from "@kebab/core";
import { db, stories } from "@kebab/db";
import { eq } from "drizzle-orm";
import { loadSources, rewriteStory } from "../src/rewrite";

const storySlug = (() => {
  const arg = process.argv.find((a) => a.startsWith("--story="));
  if (arg) return arg.slice("--story=".length);
  const idx = process.argv.indexOf("--story");
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1];
  console.error("usage: bun scripts/rewrite-run.ts --story <story-slug>");
  process.exit(1);
})();

async function main() {
  const found = await db.select().from(stories).where(eq(stories.slug, storySlug)).limit(1);
  if (found.length === 0) {
    console.error(`✕ no story with slug "${storySlug}"`);
    process.exit(1);
  }
  const story = found[0];

  const sources = await loadSources(story.id);
  console.log(`→ ${sources.length} sources for "${story.label}"`);
  console.log(`→ calling Claude (${REWRITE_MODEL}, prompt ${REWRITE_PROMPT_VERSION})...`);

  const outcome = await rewriteStory(story);
  if (outcome.kind === "no-sources") {
    console.error(`✕ story "${storySlug}" has no articles attached`);
    process.exit(1);
  }
  if (outcome.kind === "generation-failed") {
    console.error("✕ rewrite generation failed (see stderr above)");
    process.exit(1);
  }

  console.log(`\n✓ Published:`);
  console.log(`  slug: ${outcome.slug}`);
  console.log(`  Headline: ${outcome.headline}`);
  console.log(`  Live at: /artikel/${storySlug}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
