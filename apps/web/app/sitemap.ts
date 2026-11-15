import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";
import { loadLatestPublishedAt, loadPublishedSlugs } from "@/lib/stories";
import { loadIndexableTopics } from "@/lib/topics";

// Regenerate hourly: a build-time sitemap never learns about new articles.
export const revalidate = 3600;

/** Bump when the content of an evergreen page changes materially. */
const EVERGREEN_UPDATED = new Date("2026-11-15T00:00:00Z");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, topics, latest] = await Promise.all([
    loadPublishedSlugs(),
    loadIndexableTopics(),
    loadLatestPublishedAt(),
  ]);
  const fresh = latest ?? EVERGREEN_UPDATED;

  const pages: Array<[string, Date, MetadataRoute.Sitemap[number]["changeFrequency"], number]> = [
    ["/", fresh, "hourly", 1],
    ["/artikel", fresh, "hourly", 0.9],
    ["/themen", fresh, "hourly", 0.7],
    ["/lernen", EVERGREEN_UPDATED, "monthly", 0.6],
    ["/lernen/framing", EVERGREEN_UPDATED, "monthly", 0.6],
    ["/methodik", EVERGREEN_UPDATED, "monthly", 0.6],
    ["/ueber-uns", EVERGREEN_UPDATED, "monthly", 0.4],
    ["/impressum", EVERGREEN_UPDATED, "yearly", 0.1],
    ["/datenschutz", EVERGREEN_UPDATED, "yearly", 0.1],
  ];

  return [
    ...pages.map(([path, lastModified, changeFrequency, priority]) => ({
      url: absoluteUrl(path),
      lastModified,
      changeFrequency,
      priority,
    })),
    ...articles.map((article) => ({
      url: absoluteUrl(`/artikel/${article.slug}`),
      lastModified: article.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...topics.map((topic) => ({
      url: absoluteUrl(`/themen/${topic.slug}`),
      lastModified: topic.lastSeenAt,
      changeFrequency: "daily" as const,
      priority: 0.5,
    })),
  ];
}
