import type { MetadataRoute } from "next";
import { absoluteUrl, SITE } from "@/lib/site";

/**
 * Everything public is open to search and answer engines (that is the point:
 * sourced summaries should be quotable). Only API, login and the internal
 * dashboard are excluded.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/anmelden", "/redaktion"] }],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: SITE.url,
  };
}
