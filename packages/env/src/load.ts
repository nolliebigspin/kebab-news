/**
 * Side-effect module: loads the repo-root .env / .env.local into process.env.
 *
 * Import this FIRST from plain-Bun entrypoints (worker, operator scripts,
 * drizzle.config, vitest setup) before anything that reads `env`. The web app
 * must NOT import this — Next loads .env itself, and bundling a filesystem
 * dotenv call breaks Turbopack.
 *
 * `import.meta.dir` is packages/env/src; the repo root is three levels up.
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..", "..", "..");

config({ path: join(repoRoot, ".env.local"), quiet: true });
config({ path: join(repoRoot, ".env"), quiet: true });
