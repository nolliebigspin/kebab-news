// Catch-all Better Auth handler: sign-in (magic-link request), magic-link
// verification callback, session reads, sign-out, etc. The handler is built
// in @kebab/auth so apps/web never imports better-auth/* directly.
export { authGET as GET, authPOST as POST } from "@kebab/auth";
