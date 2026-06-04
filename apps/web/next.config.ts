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

const nextConfig: NextConfig = {};

export default withNextIntl(nextConfig);
