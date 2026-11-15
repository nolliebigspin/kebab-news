// Public site constants. This module must stay free of imports: it is reached
// from Client Components via `@kebab/core/site`, and anything that pulls
// `@kebab/db` would drag the Postgres driver into the browser bundle.
export const GITHUB_URL = "https://github.com/nolliebigspin/kebab-news";
export const BASE_URL = "https://kebab.news";
