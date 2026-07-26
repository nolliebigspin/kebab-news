import "@kebab/env/load";
/**
 * Publish a story's latest summary manually.
 *
 * The pipeline is autonomous — `rewrite:run` and the worker both publish on
 * generation — so this command is only a repair tool for a row that is not
 * live: e.g. a summary from before autonomous publishing, or one whose
 * transaction was interrupted. It back-links the story via
 * stories.published_article_id and archives the version it supersedes.
 *
 * Idempotent: re-running on an already-live summary is a no-op with a warning.
 * Older versions stay as history.
 *
 * Usage:
 *   mise exec -- bun scripts/rewrite-publish.ts --story <story-slug>
 */

import { db, publishedArticles, stories } from "@kebab/db";
import { desc, eq } from "drizzle-orm";

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

  const latest = await db
    .select()
    .from(publishedArticles)
    .where(eq(publishedArticles.storyId, story.id))
    .orderBy(desc(publishedArticles.rewrittenAt))
    .limit(1);

  if (latest.length === 0) {
    console.error(`✕ no summary for story "${storySlug}" — run rewrite:run first`);
    process.exit(1);
  }
  const summary = latest[0];

  if (summary.publishedAt) {
    console.warn(`⚠ latest summary for "${storySlug}" is already live (${summary.publishedAt})`);
    console.warn(`  slug: ${summary.slug}`);
    return;
  }

  const now = new Date();
  await db.transaction(async (tx) => {
    if (story.publishedArticleId && story.publishedArticleId !== summary.id) {
      await tx
        .update(publishedArticles)
        .set({ status: "archived" })
        .where(eq(publishedArticles.id, story.publishedArticleId));
    }
    await tx
      .update(publishedArticles)
      .set({
        publishedAt: now,
        status: summary.version > 1 ? "updated" : "published",
      })
      .where(eq(publishedArticles.id, summary.id));
    await tx
      .update(stories)
      .set({ publishedArticleId: summary.id })
      .where(eq(stories.id, story.id));
  });

  console.log(`✓ Published: /artikel/${story.slug}`);
  console.log(`  story:  ${storySlug}`);
  console.log(`  at:     ${now.toISOString()}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
