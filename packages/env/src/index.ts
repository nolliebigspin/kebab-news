import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

// Pure validation only — no dotenv loading here. Next loads .env for the web
// app automatically; the plain-Bun entrypoints (worker, operator scripts,
// drizzle-kit, vitest) load the repo-root .env via @kebab/env/load before
// importing anything that reads `env`. Keeping this module side-effect-free
// also stops Next's bundler from choking on a filesystem dotenv call.

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url().min(1),

    ANTHROPIC_API_KEY: z.string().min(1),
    VOYAGE_API_KEY: z.string().min(1),
    CRON_SECRET: z.string().min(16),

    // Daily-rotating salt for hashing voter IPs before they hit the DB.
    // Stable enough to dedup the same IP across the day, ephemeral enough
    // that we can't reconstruct yesterday's voters. Rotate manually.
    VOTE_DAILY_SALT: z.string().min(16),

    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  },

  runtimeEnv: process.env,

  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
