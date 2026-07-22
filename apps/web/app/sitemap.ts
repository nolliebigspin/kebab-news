import { BASE_URL } from "@kebab/core";
import type { MetadataRoute } from "next";
import { loadPublishedStoryCards } from "@/lib/stories";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const stories = await loadPublishedStoryCards(1000);
  const staticPages: MetadataRoute.Sitemap = [
    ["", "daily", 1],
    ["/artikel", "daily", 0.9],
    ["/radar", "daily", 0.7],
    ["/lernen", "monthly", 0.7],
    ["/lernen/framing", "monthly", 0.6],
    ["/methodik", "monthly", 0.7],
    ["/vision", "monthly", 0.5],
    ["/impressum", "yearly", 0.2],
    ["/datenschutz", "yearly", 0.2],
  ].map(([path, changeFrequency, priority]) => ({
    url: `${BASE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: changeFrequency as "daily" | "monthly" | "yearly",
    priority: priority as number,
  }));
  return [
    ...staticPages,
    ...stories.map((story) => ({
      url: `${BASE_URL}/artikel/${story.slug}`,
      lastModified: story.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
}
