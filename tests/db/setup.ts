// Shared test-suite hooks. Currently a no-op for state — individual test files
// manage their own state via beforeAll/afterAll.
//
// Env shim: vitest spawns a worker per test file by default, and env mutations
// in vitest.config.ts don't always propagate to those workers. We re-apply the
// placeholders here so every test file sees a fully-populated env even when
// only DATABASE_URL is set in .env.
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });

// Empty strings are treated as undefined by env.ts (emptyStringAsUndefined: true),
// so we must overwrite empty values too — not just unset ones.
if (!process.env.ANTHROPIC_API_KEY) process.env.ANTHROPIC_API_KEY = "test-anthropic-key";
if (!process.env.VOYAGE_API_KEY) process.env.VOYAGE_API_KEY = "test-voyage-key";
if (!process.env.CRON_SECRET) process.env.CRON_SECRET = "test-cron-secret-test-cron-secret";
