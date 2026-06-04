import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// @kebab/env loads the repo-root .env on import, so tests get a populated
// process.env via the import chain. Env placeholders for vars we don't
// actually exercise live in tests/db/setup.ts (re-applied per vitest worker).

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@kebab/env": r("./packages/env/src/index.ts"),
      "@kebab/db": r("./packages/db/src/index.ts"),
      "@kebab/core": r("./packages/core/src/index.ts"),
      "@": r("./apps/web"),
    },
    // The worker has a nested node_modules symlink for rss-parser; without
    // deduping, vi.mock("rss-parser") keys a different physical path than the
    // copy ingest.ts resolves, so the mock silently misses and the real feed
    // fetch runs. Force one canonical module identity.
    dedupe: ["rss-parser"],
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["./tests/db/setup.ts"],
    // All DB-touching test files share a real dev DB. Running in parallel
    // causes one file's cleanup to wipe another file's fixtures mid-test.
    // Serialize file execution to avoid this.
    fileParallelism: false,
  },
});
