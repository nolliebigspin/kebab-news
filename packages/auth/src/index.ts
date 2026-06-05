/**
 * Better Auth instance for kebab.news — passwordless magic-link login.
 *
 * - Drizzle adapter (provider "pg") backed by the shared @kebab/db client.
 *   The auth tables (user/session/account/verification) live in the single
 *   @kebab/db schema; we pass them here so the adapter maps by table name.
 * - The magic-link plugin reuses the `verification` table for its tokens and
 *   sends the link via our SMTP mailer. No password storage, no OAuth.
 *
 * Secrets (BETTER_AUTH_SECRET / SMTP_*) are optional in @kebab/env so the
 * worker and web build don't require them; betterAuth throws here if the
 * secret is missing, and the mailer throws if SMTP is unset.
 */
import { account, db, session, user, verification } from "@kebab/db";
import { env } from "@kebab/env";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { toNextJsHandler } from "better-auth/next-js";
import { magicLink } from "better-auth/plugins";

import { sendMagicLinkEmail } from "./mailer";

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user, session, account, verification },
  }),
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        await sendMagicLinkEmail(email, url);
      },
    }),
  ],
});

export type Auth = typeof auth;

/**
 * Next.js route handlers for the catch-all auth endpoint. Re-exported here so
 * apps/web imports only @kebab/auth and never `better-auth/*` directly —
 * better-auth stays a dependency of this package alone.
 */
export const { GET: authGET, POST: authPOST } = toNextJsHandler(auth);
