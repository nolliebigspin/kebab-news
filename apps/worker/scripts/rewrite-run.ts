import "@kebab/env/load";
/**
 * Milestone 3 — Operator-triggered rewrite.
 *
 * Generates a transparent German summary for one story and persists it as a
 * DRAFT (published_at = NULL) in published_articles. A separate command
 * (`bun rewrite:publish --story <slug>`) flips the latest draft to live.
 *
 * The draft / publish split is deliberate: it gives the operator one chance
 * to read the rewrite (in db:studio or the eventual admin UI) before it
 * appears at /artikel/[slug] with its generation and review status.
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

  console.log(`\n✓ Draft saved:`);
  console.log(`  slug: ${outcome.slug}`);
  console.log(`  Headline: ${outcome.headline}`);
  console.log(`\nTo publish:`);
  console.log(
    `  mise exec -- bun scripts/rewrite-publish.ts --story ${storySlug} --reviewed-by <name>`
  );
  console.log(`  # or explicitly publish as unreviewed with --unreviewed`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
