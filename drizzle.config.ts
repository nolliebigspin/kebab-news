import { defineConfig } from "drizzle-kit";

import { env } from "@/lib/env";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: env.DATABASE_URL,
  },

  // Only manage `public`. The `neon_auth` schema is owned by Neon Auth and
  // must NOT appear in our migrations. Default is ['public'] but we set it
  // explicitly for documentation and to guard against accidental
  // `drizzle-kit pull` introspecting the auth schema.
  schemaFilter: ["public"],

  // Strict mode is OFF to allow build-time `migrate` to run non-interactively
  // on Vercel. Verbose ON for build-log diagnostics.
  strict: false,
  verbose: true,
});
