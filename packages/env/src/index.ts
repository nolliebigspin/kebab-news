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

    // AI keys are only needed by the worker (annotate/embeddings/rewrite),
    // never by the web app. They are optional here so the web build doesn't
    // fail without them; the AI modules validate presence when they build
    // their client (and throw a clear error there if missing).
    ANTHROPIC_API_KEY: z.string().min(1).optional(),
    VOYAGE_API_KEY: z.string().min(1).optional(),
    CRON_SECRET: z.string().min(16),

    // Auth + email (magic-link login) are only needed by the web app via
    // @kebab/auth, never by the worker. Optional here for the same reason as
    // the AI keys: the auth/mailer modules validate presence when they build
    // their instance and throw a clear error there if missing. This keeps the
    // worker container from needing SMTP secrets and keeps tests green without
    // real values.
    BETTER_AUTH_SECRET: z.string().min(32).optional(),
    BETTER_AUTH_URL: z.string().url().optional(),
    SMTP_HOST: z.string().min(1).optional(),
    // Env values are strings; coerce to a number for nodemailer.
    SMTP_PORT: z.coerce.number().int().positive().optional(),
    SMTP_USER: z.string().min(1).optional(),
    SMTP_PASS: z.string().min(1).optional(),
    // .min(1) rather than .email() so "Name <addr>" From-headers pass.
    EMAIL_FROM: z.string().min(1).optional(),

    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  },

  runtimeEnv: process.env,

  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
