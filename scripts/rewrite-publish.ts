/**
 * Milestone 3 — Flip the latest draft rewrite for a story to "live".
 *
 * Picks the most recent published_articles row for the given story slug,
 * sets published_at = now() (if not already set), and back-links the story
 * via stories.published_article_id.
 *
 * Idempotent: re-running on an already-live draft is a no-op with a
 * warning. If there's a never-published older draft sitting around, we
 * deliberately publish the newest one only — older drafts stay as history.
 *
 * Usage:
 *   mise exec -- bun scripts/rewrite-publish.ts --story <story-slug>
 */
import { config } from "dotenv";
import { desc, eq } from "drizzle-orm";

config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });

import { db, publishedArticles, stories } from "@/lib/db";

const storySlug = (() => {
  const arg = process.argv.find((a) => a.startsWith("--story="));
  if (arg) return arg.slice("--story=".length);
  const idx = process.argv.indexOf("--story");
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1];
  console.error("usage: bun scripts/rewrite-publish.ts --story <story-slug>");
  process.exit(1);
})();

async function main() {
  const found = await db.select().from(stories).where(eq(stories.slug, storySlug)).limit(1);
  if (found.length === 0) {
    console.error(`✕ no story with slug "${storySlug}"`);
    process.exit(1);
  }
  const story = found[0];

  const drafts = await db
    .select()
    .from(publishedArticles)
    .where(eq(publishedArticles.storyId, story.id))
    .orderBy(desc(publishedArticles.rewrittenAt))
    .limit(1);

  if (drafts.length === 0) {
    console.error(`✕ no rewrite for story "${storySlug}" — run rewrite:run first`);
    process.exit(1);
  }
  const draft = drafts[0];

  if (draft.publishedAt) {
    console.warn(`⚠ latest rewrite for "${storySlug}" is already live (${draft.publishedAt})`);
    console.warn(`  slug: ${draft.slug}`);
    return;
  }

  const now = new Date();
  await db
    .update(publishedArticles)
    .set({ publishedAt: now })
    .where(eq(publishedArticles.id, draft.id));

  await db.update(stories).set({ publishedArticleId: draft.id }).where(eq(stories.id, story.id));

  console.log(`✓ Published: /articles/${draft.slug}`);
  console.log(`  story:  ${storySlug}`);
  console.log(`  at:     ${now.toISOString()}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
