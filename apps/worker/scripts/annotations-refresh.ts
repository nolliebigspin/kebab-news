import "@kebab/env/load";

import { db, stories } from "@kebab/db";
import { eq } from "drizzle-orm";
import { annotateReadyStories, annotateStory } from "../src/rewrite";

const refreshReady = process.argv.includes("--ready");
const storySlug = (() => {
  if (refreshReady) return null;
  const inlineArg = process.argv.find((arg) => arg.startsWith("--story="));
  if (inlineArg) return inlineArg.slice("--story=".length);

  const index = process.argv.indexOf("--story");
  if (index >= 0 && process.argv[index + 1]) return process.argv[index + 1];

  console.error("usage: bun annotations:refresh (--ready | --story <story-slug>)");
  process.exit(1);
})();

async function main() {
  if (refreshReady) {
    console.log("→ annotating reader-visible stories with stale source annotations");
    const refreshed = await annotateReadyStories();
    console.log(
      `✓ source annotations refreshed for ${refreshed.articles} contributions in ${refreshed.stories} topics`
    );
    return;
  }

  const found = await db
    .select({ id: stories.id, label: stories.label })
    .from(stories)
    .where(eq(stories.slug, storySlug as string))
    .limit(1);

  if (found.length === 0) {
    console.error(`✕ no story with slug "${storySlug}"`);
    process.exit(1);
  }

  console.log(`→ refreshing source annotations for "${found[0].label}"`);
  const refreshed = await annotateStory(found[0].id, { force: true });
  console.log(`✓ source annotations refreshed for ${refreshed} contributions`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
