import { config } from "dotenv";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// In the monorepo, `next dev`/`next build` run with apps/web as the project
// root, so Next only auto-loads apps/web/.env — but our .env lives at the repo
// root (shared with the worker). Load it here. On Vercel, env vars come from
// the dashboard and these files simply don't exist, so this is a no-op there.
config({ path: "../../.env.local", quiet: true });
config({ path: "../../.env", quiet: true });

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  // Node-only server libraries kept out of the bundle (required at runtime).
  //
  // kysely is here even though we never use it: better-auth's core depends on
  // @better-auth/kysely-adapter, which lazily (await import) pulls in three
  // sqlite-dialect modules that import symbols removed in kysely 0.29
  // (DEFAULT_MIGRATION_TABLE). We use the drizzle adapter on Postgres, so those
  // sqlite paths never execute — but Turbopack statically traces the lazy
  // imports and the build fails on the export mismatch. Marking kysely external
  // stops Turbopack parsing it; at runtime the sqlite branch is never hit.
  serverExternalPackages: ["nodemailer", "kysely"],
};

export default withNextIntl(nextConfig);
