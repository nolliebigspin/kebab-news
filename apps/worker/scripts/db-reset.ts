import "@kebab/env/load";
/**
 * Wipe ingested data from the database.
 *
 * Default scope: articles, stories, votes, published_articles. Outlets stay
 * so you don't have to re-seed every time. Use --full to also drop outlets
 * (then re-run `bun scripts/seed-outlets.ts`).
 *
 * Two safety layers:
 *   1. Refuses to run unless DATABASE_URL looks like a dev/branch/local DB.
 *      Pass --force to override (you almost never want this).
 *   2. Always demands you type "RESET" at the prompt.
 *
 * Usage:
 *   mise exec -- bun scripts/db-reset.ts            # default scope
 *   mise exec -- bun scripts/db-reset.ts --full     # also drops outlets
 *   mise exec -- bun scripts/db-reset.ts --force    # bypass host check
 *   mise exec -- bun scripts/db-reset.ts --yes      # skip the typed prompt
 */

import { stdin, stdout } from "node:process";
import { createInterface } from "node:readline/promises";

import { articles, db, outlets, publishedArticles, stories, votes } from "@kebab/db";
import { env } from "@kebab/env";

const args = new Set(process.argv.slice(2));
const FULL = args.has("--full");
const FORCE = args.has("--force");
const YES = args.has("--yes");

// ---------------------------------------------------------------------------
// Safety layer 1: only run against obviously-dev DBs unless --force
// ---------------------------------------------------------------------------

function looksLikeDevDatabase(url: string): boolean {
  const lower = url.toLowerCase();
  return (
    lower.includes("dev") ||
    lower.includes("local") ||
    lower.includes("test") ||
    lower.includes("branch") ||
    lower.includes("127.0.0.1")
  );
}

// Just the hostname, no creds — what we print as the "you are about to wipe" target.
function safeHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return "<unparseable DATABASE_URL>";
  }
}

const host = safeHost(env.DATABASE_URL);

if (!looksLikeDevDatabase(env.DATABASE_URL) && !FORCE) {
  console.error(`✕ Refusing to reset: DATABASE_URL host "${host}" doesn't look like a dev DB.`);
  console.error(
    `  Expected the host or URL to contain one of: dev, local, test, branch, 127.0.0.1`
  );
  console.error(`  If you really mean it, pass --force.`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Safety layer 2: typed confirmation
// ---------------------------------------------------------------------------

async function confirm(): Promise<boolean> {
  if (YES) return true;
  const rl = createInterface({ input: stdin, output: stdout });
  try {
    const scope = FULL
      ? "articles + stories + votes + published_articles + OUTLETS"
      : "articles + stories + votes + published_articles";
    console.log("");
    console.log(`⚠  About to delete from ${host}:`);
    console.log(`   ${scope}`);
    console.log("");
    const answer = await rl.question(`Type "RESET" to proceed: `);
    return answer.trim() === "RESET";
  } finally {
    rl.close();
  }
}

// ---------------------------------------------------------------------------
// Wipe
// ---------------------------------------------------------------------------

async function main() {
  const ok = await confirm();
  if (!ok) {
    console.log("✕ Aborted.");
    process.exit(1);
  }

  // Delete order matters: children before parents, even though most FKs
  // cascade. Explicit deletes are clearer and survive future schema changes
  // where someone forgets the cascade.
  console.log("→ Deleting published_articles...");
  await db.delete(publishedArticles);

  console.log("→ Deleting votes...");
  await db.delete(votes);

  console.log("→ Deleting articles...");
  await db.delete(articles);

  console.log("→ Deleting stories...");
  await db.delete(stories);

  if (FULL) {
    console.log("→ Deleting outlets...");
    await db.delete(outlets);
    console.log("");
    console.log("✓ Full reset complete. Re-seed with:");
    console.log("  mise exec -- bun scripts/seed-outlets.ts");
  } else {
    console.log("");
    console.log("✓ Reset complete. Outlets preserved. Ingest with:");
    console.log("  mise exec -- bun ingest:run");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
