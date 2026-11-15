import { BASE_URL, GITHUB_URL } from "@kebab/core/site";

/**
 * Site identity and navigation, shared by Header, MobileNav, Footer, metadata,
 * JSON-LD, the feed and llms.txt. Client-safe (no server-only imports).
 */
export const SITE = {
  name: "kebab.news",
  url: BASE_URL,
  github: GITHUB_URL,
  tagline: "We wrapped the news.",
  claim: "Viele Quellen. Eine verständliche Zusammenfassung.",
  description:
    "kebab.news bündelt Berichte vieler deutschsprachiger Medien zu einem Thema und zeigt, was belegt ist, was offen bleibt und wo Medien unterschiedlich rahmen.",
  locale: "de_DE",
  language: "de",
} as const;

export type NavKey = "articles" | "topics" | "learn" | "method" | "about";

/** Primary destinations, in reading order. `header.<key>` holds the label. */
export const PRIMARY_NAV: ReadonlyArray<{ href: string; key: NavKey }> = [
  { href: "/artikel", key: "articles" },
  { href: "/themen", key: "topics" },
  { href: "/lernen", key: "learn" },
  { href: "/methodik", key: "method" },
];

/** Everything reachable from the mobile sheet. */
export const MOBILE_NAV: ReadonlyArray<{ href: string; key: NavKey }> = [
  ...PRIMARY_NAV,
  { href: "/ueber-uns", key: "about" },
];

export function absoluteUrl(path = "/"): string {
  return path === "/" ? SITE.url : `${SITE.url}${path.startsWith("/") ? path : `/${path}`}`;
}

export function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
