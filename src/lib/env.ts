import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

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

    // When "true", the Vercel-Cron-scheduled hits to /api/cron/ingest run
    // normally. When "false" (default), scheduled hits are short-circuited
    // and `bun ingest:run` is the only way to ingest. Manual runs are
    // distinguished by the absence of the `user-agent: vercel-cron/*` header
    // and are NEVER blocked by this flag.
    AUTOMATIC_CRON: z
      .enum(["true", "false"])
      .default("false")
      .transform((v) => v === "true"),

    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  },

  client: {
    NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),
  },

  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    VOYAGE_API_KEY: process.env.VOYAGE_API_KEY,
    CRON_SECRET: process.env.CRON_SECRET,
    VOTE_DAILY_SALT: process.env.VOTE_DAILY_SALT,
    AUTOMATIC_CRON: process.env.AUTOMATIC_CRON,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },

  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
