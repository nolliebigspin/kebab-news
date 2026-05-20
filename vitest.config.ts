import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { defineConfig } from "vitest/config";

// Load .env / .env.local for tests (Next.js does this automatically at runtime,
// but vitest doesn't — without this, env.DATABASE_URL would be undefined).
// Env placeholders for vars we don't actually exercise live in tests/db/setup.ts
// because they need to be re-applied per vitest worker.
config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["./tests/db/setup.ts"],
    // All DB-touching test files share a real Neon dev DB. Running in
    // parallel causes one file's cleanup to wipe another file's fixtures
    // mid-test. Serialize file execution to avoid this.
    fileParallelism: false,
  },
});
