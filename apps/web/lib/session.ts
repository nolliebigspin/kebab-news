import { auth } from "@kebab/auth";
import { headers } from "next/headers";

/**
 * Read the current Better Auth session on the server. Returns the session +
 * user, or null when no valid session cookie is present. Used by /api/vote
 * (gate) and by server components that need to know if the reader is logged
 * in (radar pages, header).
 */
export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}
