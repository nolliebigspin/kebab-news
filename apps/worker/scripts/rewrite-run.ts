import "@kebab/env/load";
/**
 * Milestone 3 — Operator-triggered rewrite.
 *
 * Generates a neutral German rewrite for one story and persists it as a
 * DRAFT (published_at = NULL) in published_articles. A separate command
 * (`bun rewrite:publish --story <slug>`) flips the latest draft to live.
 *
 * The draft / publish split is deliberate: it gives the operator one chance
 * to read the rewrite (in db:studio or the eventual admin UI) before it
 * appears at /articles/[slug] under the disclaimer.
 *
 * Usage:
 *   mise exec -- bun scripts/rewrite-run.ts --story <story-slug>
 */

import {
  generateRewrite,
  generateStorySlug,
  REWRITE_MODEL,
  REWRITE_PROMPT_VERSION,
  type SourceItem,
} from "@kebab/core";
import { articles, db, outlets, publishedArticles, stories } from "@kebab/db";
import { eq } from "drizzle-orm";

const storySlug = (() => {
  const arg = process.argv.find((a) => a.startsWith("--story="));
  if (arg) return arg.slice("--story=".length);
  const idx = process.argv.indexOf("--story");
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1];
  console.error("usage: bun scripts/rewrite-run.ts --story <story-slug>");
  process.exit(1);
})();

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
  return rows;
}

async function main() {
  const found = await db.select().from(stories).where(eq(stories.slug, storySlug)).limit(1);
  if (found.length === 0) {
    console.error(`✕ no story with slug "${storySlug}"`);
    process.exit(1);
  }
  const story = found[0];

  const sources = await loadSources(story.id);
  if (sources.length === 0) {
    console.error(`✕ story "${storySlug}" has no articles attached`);
    process.exit(1);
  }
  console.log(`→ ${sources.length} sources for "${story.label}"`);

  console.log(`→ calling Claude (${REWRITE_MODEL}, prompt ${REWRITE_PROMPT_VERSION})...`);
  const rewrite = await generateRewrite(story.label, sources);
  if (!rewrite) {
    console.error("✕ rewrite generation failed (see stderr above)");
    process.exit(1);
  }

  const draftSlug = generateStorySlug(rewrite.neutral_headline);
  const sourceOutletSlugs = [...new Set(sources.map((s) => s.outletSlug))].sort();

  const inserted = await db
    .insert(publishedArticles)
    .values({
      storyId: story.id,
      slug: draftSlug,
      neutralHeadline: rewrite.neutral_headline,
      neutralBody: rewrite.neutral_body,
      sourceCount: sources.length,
      sourceOutletSlugs,
      model: REWRITE_MODEL,
      promptVersion: REWRITE_PROMPT_VERSION,
      // publishedAt left NULL — this is a draft.
    })
    .returning({ id: publishedArticles.id, slug: publishedArticles.slug });

  const row = inserted[0];
  console.log(`\n✓ Draft saved:`);
  console.log(`  id:   ${row.id}`);
  console.log(`  slug: ${row.slug}`);
  console.log(`\n  Headline: ${rewrite.neutral_headline}`);
  console.log(`  Body (${rewrite.neutral_body.split(/\s+/).length} words):`);
  console.log("");
  console.log(rewrite.neutral_body);
  console.log("");
  console.log(`To publish:`);
  console.log(`  mise exec -- bun scripts/rewrite-publish.ts --story ${storySlug}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
